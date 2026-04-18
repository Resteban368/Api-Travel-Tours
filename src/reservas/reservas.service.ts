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
import { Aerolinea } from '../aerolineas/entities/aerolinea.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateInfoReservaDto } from './dto/update-info-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { AuditoriaReservaService } from './services/auditoria-reserva.service';
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
    private readonly auditoriaService: AuditoriaReservaService,
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

    // 2. Validar vuelos si se envían
    const vuelosEntidades = await this.buildVuelos(dto.vuelos ?? []);

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

    // 5. Calcular valor_total
    const totalPersonas = 1 + (dto.integrantes?.length ?? 0);
    let valorTotalCalculado = dto.valor_total ?? 0;

    // Si no se envió valor_total o llegó en 0/negativo, calcular automáticamente
    if (!dto.valor_total || dto.valor_total <= 0) {
      if (tipoReserva === 'tour' && tour) {
        const precio = Number(tour.precio ?? 0);
        const precioTour = tour.precio_por_pareja
          ? precio * Math.ceil(totalPersonas / 2)
          : precio * totalPersonas;
        const costoServicios = serviciosAdicionales.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
        valorTotalCalculado = precioTour + costoServicios;
      } else if (tipoReserva === 'vuelos') {
        valorTotalCalculado = vuelosEntidades.reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
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
      valor_total: valorTotalCalculado,
      creado_por_id: creadoPorId ?? null,
      responsable,
      tour,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes ?? [],
      vuelos: vuelosEntidades,
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
    const data = await Promise.all(reservas.map((r) => this.transformResponseWithSaldo(r)));
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    return this.transformResponseWithSaldo(reserva);
  }

  async update(id: number, dto: UpdateReservaDto, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    let needsValortotalRecalc = false;
    let tourChanged = false;

    // Capturamos los valores ANTES de mutar la entidad, para calcular
    // correctamente el delta y preservar el precio snapshot del tour.
    const snapshotValorTotal = Number(reserva.valor_total);
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

    if (dto.id_responsable !== undefined) {
      const responsable = await this.clienteRepository.findOne({ where: { id: dto.id_responsable } });
      if (!responsable) throw new NotFoundException(`Cliente con ID ${dto.id_responsable} no encontrado`);
      reserva.responsable = responsable;
    }

    if (dto.correo !== undefined) reserva.correo = dto.correo;
    if (dto.estado !== undefined) reserva.estado = dto.estado;
    if (dto.notas !== undefined) reserva.notas = dto.notas;

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

        if (tourChanged) {
          // El tour cambió: recalcular desde el precio actual del nuevo tour
          const newPersonas = 1 + (reserva.integrantes?.length ?? 0);
          const precio = Number(reserva.tour.precio ?? 0);
          const precioTour = reserva.tour.precio_por_pareja
            ? precio * Math.ceil(newPersonas / 2)
            : precio * newPersonas;
          reserva.valor_total = precioTour + newServiciosCost;
        } else {
          // El tour NO cambió: preservar el precio unitario del snapshot para
          // no aplicar cambios futuros de precio a reservas ya acordadas.
          const oldServiciosCost = originalServicios.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
          const tourSubtotalSnapshot = snapshotValorTotal - oldServiciosCost;

          const oldPersonas = 1 + originalIntegrantesCount;
          const newPersonas = 1 + (reserva.integrantes?.length ?? 0);
          const precioPorPareja = reserva.tour.precio_por_pareja ?? false;
          const oldUnits = precioPorPareja ? Math.ceil(oldPersonas / 2) : oldPersonas;
          const newUnits = precioPorPareja ? Math.ceil(newPersonas / 2) : newPersonas;

          let newTourSubtotal: number;
          if (oldUnits > 0) {
            // Derivar precio-por-unidad del snapshot y escalar al nuevo nro de personas
            const precioUnitSnapshot = tourSubtotalSnapshot / oldUnits;
            newTourSubtotal = precioUnitSnapshot * newUnits;
          } else {
            // Fallback (no debería ocurrir): usar precio actual del tour
            const precio = Number(reserva.tour.precio ?? 0);
            newTourSubtotal = precioPorPareja
              ? precio * Math.ceil(newPersonas / 2)
              : precio * newPersonas;
          }
          reserva.valor_total = newTourSubtotal + newServiciosCost;
        }
      } else if (reserva.tipo_reserva === 'vuelos') {
        reserva.valor_total = (nuevosVuelos ?? reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      }
    }

    // ── Escrituras atómicas dentro de la transacción ─────────────────────────
    const saved = await this.dataSource.transaction(async (manager) => {
      if (dto.vuelos !== undefined) {
        await manager.delete(VueloReserva, { reserva: { id } });
        reserva.vuelos = nuevosVuelos!;
      }
      if (nuevosIntegrantes !== undefined) {
        await manager.delete(IntegranteReserva, { reserva: { id } });
      }
      const result = await manager.save(Reserva, reserva);
      // Forzar persistencia explícita de valor_total: TypeORM con columnas
      // numeric de PostgreSQL puede omitir el campo en el UPDATE por
      // comparación string/number en el dirty-check.
      await manager.update(Reserva, { id }, { valor_total: reserva.valor_total });
      result.valor_total = reserva.valor_total;
      return result;
    });

    return this.transformResponseWithSaldo(saved);
  }

  async cambiarEstado(id: number, nuevoEstado: string, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    const estadoAnterior = reserva.estado;
    reserva.estado = nuevoEstado;
    const saved = await this.reservaRepository.save(reserva);
    await this.auditoriaService.registrarCambioEstado(saved, estadoAnterior, nuevoEstado, realizadoPor);
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
        });
      }),
    );
  }

  private async transformResponseWithSaldo(reserva: Reserva) {
    const valor_total = Number(reserva.valor_total);

    const pagosValidados = await this.pagoRepository.find({
      where: { reserva_id: reserva.id, is_validated: true },
      select: ['monto'],
    });
    const valor_cancelado = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);
    const saldo_pendiente = valor_total - valor_cancelado;

    return { ...this.transformResponse(reserva), valor_total, valor_cancelado, saldo_pendiente };
  }

  private transformResponse(reserva: Reserva) {
    return {
      id: reserva.id,
      id_reserva: reserva.id_reserva,
      tipo_reserva: reserva.tipo_reserva,
      correo: reserva.correo,
      estado: reserva.estado,
      notas: reserva.notas,
      valor_total: reserva.valor_total,
      creado_por_id: reserva.creado_por_id,
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
        ? {
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
    };
  }
}
