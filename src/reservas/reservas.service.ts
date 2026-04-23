import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { ClienteApp } from '../clientes/entities/cliente-app.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { VueloReserva } from './entities/vuelo-reserva.entity';
import { HotelReserva } from './entities/hotel-reserva.entity';
import { Aerolinea } from '../aerolineas/entities/aerolinea.entity';
import { Hotel } from '../hoteles/entities/hotel.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateInfoReservaDto } from './dto/update-info-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { AuditoriaReservaService } from './services/auditoria-reserva.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(ToursMaestro)
    private readonly tourRepository: Repository<ToursMaestro>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepository: Repository<PagoRealizado>,
    @InjectRepository(ClienteApp)
    private readonly clienteRepository: Repository<ClienteApp>,
    @InjectRepository(IntegranteReserva)
    private readonly integranteRepository: Repository<IntegranteReserva>,
    @InjectRepository(VueloReserva)
    private readonly vueloRepository: Repository<VueloReserva>,
    @InjectRepository(Aerolinea)
    private readonly aerolineaRepository: Repository<Aerolinea>,
    @InjectRepository(HotelReserva)
    private readonly hotelReservaRepository: Repository<HotelReserva>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly auditoriaService: AuditoriaReservaService,
    private readonly auditoriaGeneralService: AuditoriaGeneralService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateReservaDto, realizadoPor?: string, creadoPorId?: number) {
    // 1. Validar tour si aplica
    const tipoReserva = dto.tipo_reserva ?? 'tour';
    let tour: ToursMaestro | null = null;
    if (tipoReserva === 'tour') {
      if (!dto.id_tour) throw new BadRequestException('id_tour es requerido para reservas de tipo tour');
      tour = await this.tourRepository.findOne({ where: { id: dto.id_tour } });
      if (!tour) throw new NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);
    }

    // 2. Validar vuelos y hoteles si se envían
    const vuelosEntidades = await this.buildVuelos(dto.vuelos ?? []);
    const hotelesEntidades = await this.buildHoteles(dto.hoteles ?? []);

    // 3. Validar el responsable
    let responsable: ClienteApp | null = null;
    if (dto.id_responsable) {
      responsable = await this.clienteRepository.findOne({ where: { id: dto.id_responsable } });
      if (!responsable) throw new NotFoundException(`Cliente con ID ${dto.id_responsable} no encontrado`);
    }

    // 4. Servicios adicionales
    let serviciosAdicionales: Servicio[] = [];
    if (dto.servicios_ids && dto.servicios_ids.length > 0) {
      serviciosAdicionales = await this.servicioRepository.find({
        where: { id_servicio: In(dto.servicios_ids) },
      });
    }

    // 5. Calcular valor_total y valor_sin_descuento
    const totalPersonas = 1 + (dto.integrantes?.length ?? 0);
    const descuentoPorPersona = dto.descuento_por_persona ?? 0;
    let valorSinDescuento = 0;
    let valorTotalCalculado = dto.valor_total ?? 0;

    if (tipoReserva === 'tour' && tour) {
      const precio = Number(tour.precio ?? 0);
      const unidades = tour.precio_por_pareja ? Math.ceil(totalPersonas / 2) : totalPersonas;
      const costoServicios = serviciosAdicionales.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      valorSinDescuento = precio * unidades + costoServicios;
      // Si no se envió valor_total o llegó en 0/negativo, calcular automáticamente
      if (!dto.valor_total || dto.valor_total <= 0) {
        valorTotalCalculado = valorSinDescuento - descuentoPorPersona * unidades;
      }
    } else if (tipoReserva === 'vuelos') {
      const totalVuelos = vuelosEntidades.reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      const totalHoteles = hotelesEntidades.reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
      const totalServicios = serviciosAdicionales.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      valorSinDescuento = totalVuelos + totalHoteles + totalServicios;
      if (!dto.valor_total || dto.valor_total <= 0) {
        valorTotalCalculado = valorSinDescuento;
      }
    }


    // 6. Crear la reserva
    const idReservaGenerado = `RES-${uuidv4().substring(0, 8).toUpperCase()}`;
    const reserva = this.reservaRepository.create({
      id_reserva: idReservaGenerado,
      tipo_reserva: tipoReserva,
      correo: dto.correo,
      estado: dto.estado ?? 'pendiente',
      notas: dto.notas,
      descuento_por_persona: descuentoPorPersona,
      valor_sin_descuento: valorSinDescuento,
      valor_total: valorTotalCalculado,
      creado_por_id: creadoPorId ?? null,
      utilidad: dto.utilidad ?? null,
      responsable,
      tour,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes ?? [],
      vuelos: vuelosEntidades,
      hoteles: hotelesEntidades,
    });

    // Advertencia de cupos (no bloquea, solo informa)
    let advertencia_cupos: string | null = null;
    if (tour && tour.cupos !== null) {
      const cuposUsados = await this.calcularCuposUsados(tour.id);
      const cuposDisponibles = Math.max(0, tour.cupos - cuposUsados);
      if (totalPersonas > cuposDisponibles) {
        advertencia_cupos =
          cuposDisponibles === 0
            ? `El tour "${tour.nombre_tour}" no tiene cupos disponibles. Se registró la reserva igualmente.`
            : `El tour "${tour.nombre_tour}" solo tiene ${cuposDisponibles} cupo(s) disponible(s) pero se solicitaron ${totalPersonas}. Se registró la reserva igualmente.`;
      }
    }

    const saved = await this.reservaRepository.save(reserva);
    await this.auditoriaService.registrarCreacion(saved, realizadoPor);
    await this.auditoriaGeneralService.registrar({
      usuario_id: creadoPorId ?? null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'reservas',
      operacion: 'CREAR',
      documento_id: saved.id_reserva,
      detalle: { id_reserva: saved.id_reserva, tipo_reserva: saved.tipo_reserva, estado: saved.estado, valor_total: saved.valor_total },
    });
    const response = this.transformResponse(saved);
    return advertencia_cupos ? { ...response, advertencia_cupos } : response;
  }

  async findAll(page = 1, limit = 20, rol?: string, userId?: number) {
    const where = rol !== 'admin' && userId ? { creado_por_id: userId } : {};
    const [reservas, total] = await this.reservaRepository.findAndCount({
      where,
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const userIds = [...new Set(reservas.map((r) => r.creado_por_id).filter((id) => id != null))];
    let usuarios: Record<number, Usuario> = {};
    if (userIds.length > 0) {
      const usersList = await this.usuarioRepository.find({
        where: { id_usuario: In(userIds) },
        select: ['id_usuario', 'nombre', 'email', 'rol_nombre', 'activo', 'ultimo_acceso'],
      });
      usuarios = usersList.reduce((acc, user) => {
        acc[user.id_usuario] = user;
        return acc;
      }, {} as Record<number, Usuario>);
    }

    const data = await Promise.all(
      reservas.map((r) => {
        const agente = r.creado_por_id ? usuarios[r.creado_por_id] || null : null;
        return this.transformResponseWithSaldo(r, agente);
      }),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    let agente: Usuario | null = null;
    if (reserva.creado_por_id) {
      agente = await this.usuarioRepository.findOne({
        where: { id_usuario: reserva.creado_por_id },
        select: ['id_usuario', 'nombre', 'email', 'rol_nombre', 'activo', 'ultimo_acceso'],
      });
    }

    return this.transformResponseWithSaldo(reserva, agente, true);
  }

  async update(id: number, dto: UpdateReservaDto, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    let needsValortotalRecalc = false;
    let tourChanged = false;

    // Capturamos los valores ANTES de mutar la entidad, para calcular
    // correctamente el delta y preservar el precio snapshot del tour.
    const snapshotValorSinDescuento = Number(reserva.valor_sin_descuento);
    const antesReserva = { id_reserva: reserva.id_reserva, tipo_reserva: reserva.tipo_reserva, estado: reserva.estado, valor_total: Number(reserva.valor_total), valor_sin_descuento: Number(reserva.valor_sin_descuento) };
    const originalServicios = reserva.servicios ?? [];
    const originalIntegrantesCount = reserva.integrantes?.length ?? 0;

    // ── Validaciones y preparación FUERA de la transacción ──────────────────
    if (dto.tipo_reserva !== undefined) reserva.tipo_reserva = dto.tipo_reserva;

    if (dto.id_tour !== undefined) {
      if (dto.id_tour === null) {
        reserva.tour = null;
        tourChanged = true;
        needsValortotalRecalc = true;
      } else {
        const tour = await this.tourRepository.findOne({ where: { id: dto.id_tour } });
        if (!tour) throw new NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);
        // tourChanged solo es true si el tour realmente cambia a uno diferente.
        // El Flutter siempre envía id_tour aunque no haya cambiado, por lo que
        // comparamos con el tour actual antes de marcarlo como cambiado.
        tourChanged = reserva.tour?.id !== dto.id_tour;
        reserva.tour = tour;
        needsValortotalRecalc = true;
      }
    }

    const nuevosVuelos = dto.vuelos !== undefined
      ? await this.buildVuelos(dto.vuelos)
      : undefined;

    const nuevosHoteles = dto.hoteles !== undefined
      ? await this.buildHoteles(dto.hoteles)
      : undefined;

    if (dto.utilidad !== undefined) reserva.utilidad = dto.utilidad;

    if (dto.id_responsable !== undefined) {
      const responsable = await this.clienteRepository.findOne({ where: { id: dto.id_responsable } });
      if (!responsable) throw new NotFoundException(`Cliente con ID ${dto.id_responsable} no encontrado`);
      reserva.responsable = responsable;
    }

    if (dto.correo !== undefined) reserva.correo = dto.correo;
    if (dto.estado !== undefined) reserva.estado = dto.estado;
    if (dto.notas !== undefined) reserva.notas = dto.notas;
    if (dto.descuento_por_persona !== undefined) {
      reserva.descuento_por_persona = dto.descuento_por_persona;
      needsValortotalRecalc = true;
    }

    if (dto.servicios_ids !== undefined) {
      reserva.servicios = dto.servicios_ids.length > 0
        ? await this.servicioRepository.find({ where: { id_servicio: In(dto.servicios_ids) } })
        : [];
      needsValortotalRecalc = true;
    }

    const nuevosIntegrantes = dto.integrantes !== undefined
      ? dto.integrantes.map((i) => this.integranteRepository.create(i))
      : undefined;

    if (nuevosIntegrantes !== undefined) {
      reserva.integrantes = nuevosIntegrantes;
      needsValortotalRecalc = true;
    }

    if (dto.valor_total !== undefined) {
      reserva.valor_total = dto.valor_total;
    } else if (needsValortotalRecalc) {
      if (reserva.tipo_reserva === 'tour' && reserva.tour) {
        const newServiciosCost = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
        const precioPorPareja = reserva.tour.precio_por_pareja ?? false;
        const newPersonas = 1 + (reserva.integrantes?.length ?? 0);
        const newUnits = precioPorPareja ? Math.ceil(newPersonas / 2) : newPersonas;
        const descuento = Number(reserva.descuento_por_persona ?? 0);

        let newTourSubtotal: number;
        if (tourChanged) {
          // El tour cambió: recalcular desde el precio actual del nuevo tour
          const precio = Number(reserva.tour.precio ?? 0);
          newTourSubtotal = precio * newUnits;
        } else {
          // El tour NO cambió: preservar el precio unitario del snapshot para
          // no aplicar cambios futuros de precio a reservas ya acordadas.
          const oldServiciosCost = originalServicios.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
          const tourSubtotalSnapshot = snapshotValorSinDescuento - oldServiciosCost;

          const oldPersonas = 1 + originalIntegrantesCount;
          const oldUnits = precioPorPareja ? Math.ceil(oldPersonas / 2) : oldPersonas;

          if (oldUnits > 0) {
            // Derivar precio-por-unidad del snapshot y escalar al nuevo nro de personas
            const precioUnitSnapshot = tourSubtotalSnapshot / oldUnits;
            newTourSubtotal = precioUnitSnapshot * newUnits;
          } else {
            // Fallback: usar precio actual del tour
            const precio = Number(reserva.tour.precio ?? 0);
            newTourSubtotal = precio * newUnits;
          }
        }

        const newValorSinDescuento = newTourSubtotal + newServiciosCost;
        reserva.valor_sin_descuento = newValorSinDescuento;
        reserva.valor_total = newValorSinDescuento - descuento * newUnits;
      } else if (reserva.tipo_reserva === 'vuelos') {
        const totalVuelos = (nuevosVuelos ?? reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
        const totalHoteles = (nuevosHoteles ?? reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
        const totalServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
        reserva.valor_sin_descuento = totalVuelos + totalHoteles + totalServicios;
        reserva.valor_total = totalVuelos + totalHoteles + totalServicios;
      }
    }

    // ── Escrituras atómicas dentro de la transacción ─────────────────────────
    const saved = await this.dataSource.transaction(async (manager) => {
      if (dto.vuelos !== undefined) {
        await manager.delete(VueloReserva, { reserva: { id } });
        reserva.vuelos = nuevosVuelos!;
      }
      if (dto.hoteles !== undefined) {
        await manager.delete(HotelReserva, { reserva: { id } });
        reserva.hoteles = nuevosHoteles!;
      }
      if (nuevosIntegrantes !== undefined) {
        await manager.delete(IntegranteReserva, { reserva: { id } });
      }
      const result = await manager.save(Reserva, reserva);
      // Forzar persistencia explícita de columnas numeric: TypeORM puede omitirlas
      // en el UPDATE por comparación string/number en el dirty-check.
      await manager.update(Reserva, { id }, {
        valor_total: reserva.valor_total,
        valor_sin_descuento: reserva.valor_sin_descuento,
        descuento_por_persona: reserva.descuento_por_persona,
      });
      result.valor_total = reserva.valor_total;
      result.valor_sin_descuento = reserva.valor_sin_descuento;
      result.descuento_por_persona = reserva.descuento_por_persona;
      return result;
    });

    const despues = { id_reserva: saved.id_reserva, tipo_reserva: saved.tipo_reserva, estado: saved.estado, valor_total: Number(saved.valor_total), valor_sin_descuento: Number(saved.valor_sin_descuento) };
    await this.auditoriaGeneralService.registrar({
      usuario_id: null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'reservas',
      operacion: 'ACTUALIZAR',
      documento_id: saved.id_reserva,
      detalle: { antes: antesReserva, despues },
    });
    return this.transformResponseWithSaldo(saved);
  }

  async historialCliente(clienteId: number) {
    const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);

    const reservas = await this.reservaRepository.find({
      where: { responsable: { id: clienteId } },
      order: { fecha_creacion: 'DESC' },
    });

    const data = await Promise.all(reservas.map((r) => this.transformResponseWithSaldo(r)));

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        correo: cliente.correo,
        telefono: cliente.telefono,
      },
      total_viajes: data.length,
      reservas: data,
    };
  }

  async cambiarEstado(id: number, nuevoEstado: string, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    const estadoAnterior = reserva.estado;
    reserva.estado = nuevoEstado;
    const saved = await this.reservaRepository.save(reserva);
    await this.auditoriaService.registrarCambioEstado(saved, estadoAnterior, nuevoEstado, realizadoPor);
    await this.auditoriaGeneralService.registrar({
      usuario_id: null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'reservas',
      operacion: 'ACTUALIZAR',
      documento_id: saved.id_reserva,
      detalle: {
        antes: { id_reserva: reserva.id_reserva, estado: estadoAnterior },
        despues: { id_reserva: saved.id_reserva, estado: nuevoEstado },
      },
    });
    return this.transformResponseWithSaldo(saved);
  }

  async actualizarInfo(id: number, datos: UpdateInfoReservaDto, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    if (datos.correo !== undefined && datos.correo !== reserva.correo) {
      await this.auditoriaService.registrarEdicion(reserva, 'correo', reserva.correo, datos.correo, realizadoPor);
      reserva.correo = datos.correo;
    }

    if (datos.id_responsable !== undefined) {
      const responsable = await this.clienteRepository.findOne({ where: { id: datos.id_responsable } });
      if (!responsable) throw new NotFoundException(`Cliente con ID ${datos.id_responsable} no encontrado`);
      await this.auditoriaService.registrarEdicion(reserva, 'id_responsable', reserva.responsable?.id ?? null, datos.id_responsable, realizadoPor);
      reserva.responsable = responsable;
    }

    const saved = await this.reservaRepository.save(reserva);
    return this.transformResponseWithSaldo(saved);
  }

  async obtenerAuditoria(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    return this.auditoriaService.obtenerAuditoria(id);
  }

  // --------------- helpers ---------------

  private async calcularCuposUsados(tourId: number): Promise<number> {
    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId } },
    });
    const activas = reservas.filter((r) => r.estado !== 'cancelado');
    let cuposUsados = 0;
    for (const reserva of activas) {
      const personas = 1 + (reserva.integrantes?.length ?? 0);
      if (reserva.estado === 'al dia') {
        cuposUsados += personas;
        continue;
      }
      const tienePageValidado = await this.pagoRepository.findOne({
        where: { reserva_id: reserva.id, is_validated: true },
        select: ['id_pago'],
      });
      if (tienePageValidado) cuposUsados += personas;
    }
    return cuposUsados;
  }

  private async buildHoteles(hoteles: CreateReservaDto['hoteles']): Promise<HotelReserva[]> {
    if (!hoteles || hoteles.length === 0) return [];

    return Promise.all(
      hoteles.map(async (h) => {
        const hotel = await this.hotelRepository.findOne({ where: { id: h.hotel_id } });
        if (!hotel) throw new NotFoundException(`Hotel con ID ${h.hotel_id} no encontrado`);
        return this.hotelReservaRepository.create({
          hotel,
          numero_reserva: h.numero_reserva,
          fecha_checkin: h.fecha_checkin,
          fecha_checkout: h.fecha_checkout,
          valor: h.valor,
        });
      }),
    );
  }

  private async buildVuelos(vuelos: CreateReservaDto['vuelos']): Promise<VueloReserva[]> {
    if (!vuelos || vuelos.length === 0) return [];

    return Promise.all(
      vuelos.map(async (v) => {
        let aerolinea: Aerolinea | null = null;
        if (v.aerolinea_id) {
          aerolinea = await this.aerolineaRepository.findOne({ where: { id: v.aerolinea_id } });
          if (!aerolinea) throw new NotFoundException(`Aerolínea con ID ${v.aerolinea_id} no encontrada`);
        }
        return this.vueloRepository.create({
          aerolinea,
          numero_vuelo: v.numero_vuelo ?? null,
          origen: v.origen,
          destino: v.destino,
          fecha_salida: v.fecha_salida,
          fecha_llegada: v.fecha_llegada,
          hora_salida: v.hora_salida,
          hora_llegada: v.hora_llegada,
          clase: v.clase ?? 'economy',
          precio: v.precio ?? 0,
          reserva_vuelo: v.reserva_vuelo,
          tipo_vuelo: v.tipo_vuelo ?? 'ida',
        });
      }),
    );
  }

  private calcularValorReal(reserva: Reserva): { valor_sin_descuento: number; valor_total: number } {
    if (reserva.tipo_reserva === 'tour' && reserva.tour) {
      const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
      const unidades = reserva.tour.precio_por_pareja
        ? Math.ceil(totalPersonas / 2)
        : totalPersonas;
      const precio = Number(reserva.tour.precio ?? 0);
      const costoServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      const descuento = Number(reserva.descuento_por_persona ?? 0);
      const valor_sin_descuento = precio * unidades + costoServicios;
      const valor_total = valor_sin_descuento - descuento * unidades;
      return { valor_sin_descuento, valor_total };
    }

    if (reserva.tipo_reserva === 'vuelos') {
      const totalVuelos = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      const totalHoteles = (reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
      const totalServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      const valor_total = totalVuelos + totalHoteles + totalServicios;
      return { valor_sin_descuento: valor_total, valor_total };
    }

    return {
      valor_sin_descuento: Number(reserva.valor_sin_descuento ?? 0),
      valor_total: Number(reserva.valor_total ?? 0),
    };
  }

  private async transformResponseWithSaldo(reserva: Reserva, agente: Usuario | null = null, fullTour = false) {
    const pagosValidados = await this.pagoRepository.find({
      where: { reserva_id: reserva.id, is_validated: true },
      order: { fecha_creacion: 'ASC' },
    });
    const valor_cancelado = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);

    // En findOne recalculamos dinámicamente; en findAll usamos el valor almacenado
    const { valor_sin_descuento, valor_total } = fullTour
      ? this.calcularValorReal(reserva)
      : { valor_sin_descuento: Number(reserva.valor_sin_descuento), valor_total: Number(reserva.valor_total) };

    const saldo_pendiente = valor_total - valor_cancelado;

    const pagosData = fullTour
      ? pagosValidados.map((p) => ({
          id_pago: p.id_pago,
          monto: Number(p.monto),
          tipo_documento: p.tipo_documento,
          proveedor_comercio: p.proveedor_comercio,
          nit: p.nit,
          metodo_pago: p.metodo_pago,
          referencia: p.referencia,
          fecha_documento: p.fecha_documento,
          url_imagen: p.url_imagen,
          fecha_creacion: p.fecha_creacion,
        }))
      : undefined;

    const total_personas = fullTour
      ? 1 + (reserva.integrantes?.length ?? 0)
      : undefined;

    let valor_personas: number | undefined;
    if (fullTour && reserva.tipo_reserva === 'tour' && reserva.tour) {
      const unidades = reserva.tour.precio_por_pareja
        ? Math.ceil(total_personas! / 2)
        : total_personas!;
      valor_personas = Number(reserva.tour.precio ?? 0) * unidades;
    }

    const base = {
      ...this.transformResponse(reserva, agente, fullTour),
      valor_sin_descuento,
      valor_total,
      valor_cancelado,
      saldo_pendiente,
      ...(total_personas !== undefined && { total_personas }),
      ...(valor_personas !== undefined && { valor_personas }),
    };
    return fullTour ? { ...base, pagos_validados: pagosData } : base;
  }

  private transformResponse(reserva: Reserva, agente: Usuario | null = null, fullTour = false) {
    return {
      id: reserva.id,
      id_reserva: reserva.id_reserva,
      tipo_reserva: reserva.tipo_reserva,
      correo: reserva.correo,
      estado: reserva.estado,
      notas: reserva.notas,
      descuento_por_persona: reserva.descuento_por_persona,
      valor_sin_descuento: reserva.valor_sin_descuento,
      valor_total: reserva.valor_total,
      utilidad: reserva.utilidad,
      creado_por_id: reserva.creado_por_id,
      agente: agente
        ? {
            id: agente.id_usuario,
            nombre: agente.nombre,
            email: agente.email,
            rol: agente.rol_nombre,
            activo: agente.activo,
            ultimo_acceso: agente.ultimo_acceso,
          }
        : null,
      fecha_creacion: reserva.fecha_creacion,
      fecha_actualizacion: reserva.fecha_actualizacion,
      responsable: reserva.responsable
        ? {
            id: reserva.responsable.id,
            nombre: reserva.responsable.nombre,
            telefono: reserva.responsable.telefono,
            correo: reserva.responsable.correo,
            tipo_documento: reserva.responsable.tipo_documento,
            documento: reserva.responsable.documento,
          }
        : null,
      tour: reserva.tour
        ? fullTour
          ? {
              id: reserva.tour.id,
              id_tour: reserva.tour.id_tour,
              nombre: reserva.tour.nombre_tour,
              agencia: reserva.tour.agencia,
              fecha_inicio: reserva.tour.fecha_inicio,
              fecha_fin: reserva.tour.fecha_fin,
              precio: reserva.tour.precio,
              precio_por_pareja: reserva.tour.precio_por_pareja ?? false,
              punto_partida: reserva.tour.punto_partida,
              hora_partida: reserva.tour.hora_partida,
              llegada: reserva.tour.llegada,
              url_imagen: reserva.tour.url_imagen,
              link_pdf: reserva.tour.link_pdf,
              inclusions: reserva.tour.inclusions,
              exclusions: reserva.tour.exclusions,
              itinerary: reserva.tour.itinerary,
              cupos: reserva.tour.cupos,
              es_promocion: reserva.tour.es_promocion,
            }
          : {
              id: reserva.tour.id,
              nombre: reserva.tour.nombre_tour,
              fecha_inicio: reserva.tour.fecha_inicio,
              fecha_fin: reserva.tour.fecha_fin,
              precio: reserva.tour.precio,
              precio_por_pareja: reserva.tour.precio_por_pareja ?? false,
              es_promocion: reserva.tour.es_promocion,
            }
        : null,
      vuelos: (reserva.vuelos ?? []).map((v) => ({
        id: v.id,
        aerolinea: v.aerolinea
          ? {
              id: v.aerolinea.id,
              nombre: v.aerolinea.nombre,
              codigo_iata: v.aerolinea.codigo_iata,
              logo_url: v.aerolinea.logo_url,
            }
          : null,
        numero_vuelo: v.numero_vuelo,
        origen: v.origen,
        destino: v.destino,
        fecha_salida: v.fecha_salida,
        fecha_llegada: v.fecha_llegada,
        hora_salida: v.hora_salida,
        hora_llegada: v.hora_llegada,
        clase: v.clase,
        precio: v.precio,
        reserva_vuelo: v.reserva_vuelo,
        tipo_vuelo: v.tipo_vuelo,
      })),
      servicios_adicionales: (reserva.servicios ?? []).map((s) => ({
        id_servicio: s.id_servicio,
        nombre_servicio: s.nombre_servicio,
        costo: s.costo,
        descripcion: s.descripcion,
      })),
      integrantes: (reserva.integrantes ?? []).map((i) => ({
        id: i.id,
        nombre: i.nombre,
        telefono: i.telefono,
        fecha_nacimiento: i.fecha_nacimiento,
        tipo_documento: i.tipo_documento,
        documento: i.documento,
      })),
      hoteles: (reserva.hoteles ?? []).map((h) => ({
        id: h.id,
        hotel: {
          id: h.hotel.id,
          nombre: h.hotel.nombre,
          ciudad: h.hotel.ciudad,
          telefono: h.hotel.telefono,
          direccion: h.hotel.direccion,
        },
        numero_reserva: h.numero_reserva,
        fecha_checkin: h.fecha_checkin,
        fecha_checkout: h.fecha_checkout,
        valor: Number(h.valor ?? 0),
      })),
    };
  }
}
