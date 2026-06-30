import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Or } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { TourSalida } from '../tours/entities/tour-salida.entity';
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
import { SeleccionAsientosService } from '../seleccion-asientos/seleccion-asientos.service';
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
    @InjectRepository(TourSalida)
    private readonly tourSalidaRepository: Repository<TourSalida>,
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
    private readonly seleccionAsientosService: SeleccionAsientosService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateReservaDto, realizadoPor?: string, creadoPorId?: number) {
    // 1. Validar tour si aplica
    const tipoReserva = dto.tipo_reserva ?? 'tour';
    let tour: ToursMaestro | null = null;
    let tourSalida: TourSalida | null = null;
    if (tipoReserva === 'tour') {
      if (!dto.id_tour) throw new BadRequestException('id_tour es requerido para reservas de tipo tour');
      tour = await this.tourRepository.findOne({
        where: { id: dto.id_tour },
        relations: ['precios_grupales'],
      });
      if (!tour) throw new NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);

      if (tour.disponibilidad_tipo === 'permanente') {
        if (!dto.fecha_inicio_personalizada || !dto.fecha_fin_personalizada) {
          throw new BadRequestException(
            'El tour es permanente. Debes especificar fecha_inicio_personalizada y fecha_fin_personalizada para registrar las fechas de esta reserva.',
          );
        }
      }

      if (tour.disponibilidad_tipo === 'multiples_fechas') {
        if (!dto.id_tour_salida) {
          throw new BadRequestException(
            'El tour tiene múltiples salidas. Debes especificar id_tour_salida para indicar en qué fecha quieres reservar.',
          );
        }
        tourSalida = await this.tourSalidaRepository.findOne({
          where: { id: dto.id_tour_salida, tour: { id: dto.id_tour } },
        });
        if (!tourSalida) {
          throw new NotFoundException(`La salida ${dto.id_tour_salida} no existe o no pertenece al tour ${dto.id_tour}`);
        }
        if (!tourSalida.is_active) {
          throw new BadRequestException(`La salida seleccionada no está disponible`);
        }

        // Validar que el bus pertenezca a esa salida (si se envía bus_layout_id)
        if (dto.bus_layout_id) {
          const salidaConBuses = await this.tourSalidaRepository.findOne({
            where: { id: dto.id_tour_salida },
            relations: ['busLayouts'],
          });
          const busValido = (salidaConBuses?.busLayouts ?? []).some((b) => b.id === dto.bus_layout_id);
          if (!busValido) {
            throw new BadRequestException(
              `El bus ${dto.bus_layout_id} no está asignado a la salida ${dto.id_tour_salida}. Verifica los buses disponibles para esta fecha.`,
            );
          }
        }
      }
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

    // 5. Validar que la reserva tenga al menos un componente
    if (!tour && hotelesEntidades.length === 0 && vuelosEntidades.length === 0 && serviciosAdicionales.length === 0) {
      throw new BadRequestException('La reserva debe incluir al menos un tour, hotel, vuelo o servicio adicional.');
    }

    // 6. Calcular valor_total y valor_sin_descuento (siempre automático)
    const totalPersonas = 1 + (dto.integrantes?.length ?? 0);
    const descuentoPorPersona = dto.descuento_por_persona ?? 0;
    let tourSubtotal = 0;
    let descuentoTotal = 0;

    let precioResponsableGuardar: number | null = dto.precio_responsable_aplicado ?? null;

    if (tour) {
      const modoPrecio = tour.modo_precio ?? (tour.precio_por_pareja ? 'pareja' : 'individual');
      const usaPreciosCategorias =
        dto.precio_responsable_aplicado != null ||
        (dto.integrantes ?? []).some((i) => i.precio_aplicado != null);

      if (modoPrecio === 'grupal') {
        const grupoActivo = (tour.precios_grupales ?? [])
          .filter((pg) => pg.activo)
          .find((pg) => totalPersonas >= pg.min_personas && totalPersonas <= pg.max_personas);
        if (!grupoActivo) {
          throw new BadRequestException(
            `El tour no tiene un precio grupal definido para ${totalPersonas} persona(s). Verifica los rangos del tour.`,
          );
        }
        tourSubtotal = Number(grupoActivo.precio);
        precioResponsableGuardar = Number(grupoActivo.precio);
      } else if (usaPreciosCategorias) {
        const precioResp = dto.precio_responsable_aplicado ?? 0;
        const ints = dto.integrantes ?? [];
        if (modoPrecio === 'pareja') {
          const unidades = Math.ceil(totalPersonas / 2);
          let precioTotal = precioResp;
          for (let i = 1; i < ints.length; i += 2) precioTotal += ints[i].precio_aplicado ?? 0;
          tourSubtotal = precioTotal;
          descuentoTotal = descuentoPorPersona * unidades;
        } else {
          const unidades = totalPersonas;
          tourSubtotal = precioResp + ints.reduce((sum, i) => sum + (i.precio_aplicado ?? 0), 0);
          descuentoTotal = descuentoPorPersona * unidades;
        }
      } else {
        const unidades = modoPrecio === 'pareja' ? Math.ceil(totalPersonas / 2) : totalPersonas;
        tourSubtotal = Number(tour.precio ?? 0) * unidades;
        descuentoTotal = descuentoPorPersona * unidades;
      }
    }

    const totalHoteles = hotelesEntidades.reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
    const totalVuelos = vuelosEntidades.reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
    const costoServicios = serviciosAdicionales.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);

    const valorSinDescuento = tourSubtotal + totalHoteles + totalVuelos + costoServicios;
    const valorTotalCalculado = valorSinDescuento - descuentoTotal;


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
      precio_responsable_id: dto.precio_responsable_id ?? null,
      precio_responsable_aplicado: precioResponsableGuardar,
      bus_layout_id: dto.bus_layout_id ?? null,
      responsable,
      tour,
      tour_salida: tourSalida,
      fecha_inicio_personalizada: dto.fecha_inicio_personalizada ?? null,
      fecha_fin_personalizada: dto.fecha_fin_personalizada ?? null,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes ?? [],
      vuelos: vuelosEntidades,
      hoteles: hotelesEntidades,
    });

    // Advertencia de cupos (no bloquea, solo informa)
    let advertencia_cupos: string | null = null;
    if (tour && tour.disponibilidad_tipo !== 'permanente') {
      let cuposLimite: number | null = null;
      let cuposUsados = 0;

      if (tourSalida) {
        cuposLimite = tourSalida.cupos ?? tour.cupos;
        if (cuposLimite !== null) cuposUsados = await this.calcularCuposUsadosPorSalida(tourSalida.id);
      } else if (tour.cupos !== null) {
        cuposLimite = tour.cupos;
        cuposUsados = await this.calcularCuposUsados(tour.id);
      }

      if (cuposLimite !== null) {
        const cuposDisponibles = Math.max(0, cuposLimite - cuposUsados);
        if (totalPersonas > cuposDisponibles) {
          const contexto = tourSalida ? ` (salida ${tourSalida.fecha_inicio})` : '';
          advertencia_cupos =
            cuposDisponibles === 0
              ? `El tour "${tour.nombre_tour}"${contexto} no tiene cupos disponibles. Se registró la reserva igualmente.`
              : `El tour "${tour.nombre_tour}"${contexto} solo tiene ${cuposDisponibles} cupo(s) disponible(s) pero se solicitaron ${totalPersonas}. Se registró la reserva igualmente.`;
        }
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

    // Generar link de selección de asientos si hay bus_layout_id
    let seleccion_link: string | null = null;
    if (saved.bus_layout_id) {
      const tokenRecord = await this.seleccionAsientosService.generarToken(saved.id);
      seleccion_link = tokenRecord.link;
    }

    const response = this.transformResponse(saved);
    const full = seleccion_link ? { ...response, seleccion_link } : response;
    return advertencia_cupos ? { ...full, advertencia_cupos } : full;
  }

  async findAll(page = 1, limit = 50, search?: string, estado?: string, fechaDesde?: string, fechaHasta?: string) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.reservaRepository.createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.responsable', 'responsable')
      .leftJoinAndSelect('reserva.tour', 'tour')
      .leftJoinAndSelect('tour.precios_grupales', 'precios_grupales')
      .leftJoinAndSelect('reserva.tour_salida', 'tour_salida')
      .leftJoinAndSelect('reserva.integrantes', 'integrantes')
      .leftJoinAndSelect('reserva.servicios', 'servicios')
      .leftJoinAndSelect('reserva.hoteles', 'hoteles')
      .leftJoinAndSelect('hoteles.hotel', 'hotel')
      .leftJoinAndSelect('reserva.vuelos', 'vuelos')
      .leftJoinAndSelect('vuelos.aerolinea', 'aerolinea');

    if (estado) {
      queryBuilder.andWhere('reserva.estado = :estado', { estado });
    }

    if (fechaDesde) {
      queryBuilder.andWhere('reserva.fecha_creacion >= :fechaDesde', { fechaDesde: new Date(fechaDesde) });
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('reserva.fecha_creacion <= :fechaHasta', { fechaHasta: hasta });
    }

    if (search) {
      queryBuilder.andWhere(
        '(reserva.id_reserva ILIKE :search OR reserva.correo ILIKE :search OR responsable.nombre ILIKE :search OR responsable.documento ILIKE :search OR tour.nombre_tour ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('reserva.fecha_creacion', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [reservas, total] = await queryBuilder.getManyAndCount();

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

    // Batch queries: pagos y asientos de todas las reservas de la página
    const reservaIds = reservas.map((r) => r.id);
    const [todosPagos, asientosBatchMap] = await Promise.all([
      reservaIds.length > 0
        ? this.pagoRepository.find({
            where: { reserva_id: In(reservaIds), is_validated: true },
            select: ['reserva_id', 'monto'],
          })
        : Promise.resolve([]),
      this.seleccionAsientosService.getAsientosConfirmadosBatch(reservaIds),
    ]);

    const valorCanceladoMap = new Map<number, number>();
    for (const p of todosPagos) {
      const rid = p.reserva_id!;
      valorCanceladoMap.set(rid, (valorCanceladoMap.get(rid) ?? 0) + Number(p.monto));
    }

    const data = await Promise.all(
      reservas.map(async (r) => {
        const agente = r.creado_por_id ? usuarios[r.creado_por_id] || null : null;
        const {
          correo, notas, descuento_por_persona, valor_sin_descuento, utilidad,
          precio_responsable_id, precio_responsable_aplicado, bus_layout_id,
          creado_por_id, total_personas, valor_cancelado, servicios_adicionales,
          hoteles, ...base
        } = await this.transformResponseWithSaldo(r, agente, false, valorCanceladoMap);
        return base;
      }),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const reserva = await this.reservaRepository.findOne({
      where: { id },
      relations: ['tour_salida'],
    });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    let agente: Usuario | null = null;
    if (reserva.creado_por_id) {
      agente = await this.usuarioRepository.findOne({
        where: { id_usuario: reserva.creado_por_id },
        select: ['id_usuario', 'nombre', 'email', 'rol_nombre', 'activo', 'ultimo_acceso'],
      });
    }

    const base = await this.transformResponseWithSaldo(reserva, agente, true);
    const [seleccion_link, asientos_bus] = await Promise.all([
      this.seleccionAsientosService.getOrGenerarLink(reserva.id),
      reserva.bus_layout_id
        ? this.seleccionAsientosService.getAsientosConfirmados(reserva.id)
        : Promise.resolve([]),
    ]);
    return {
      ...base,
      ...(seleccion_link && { seleccion_link }),
      asientos_bus,
    };
  }

  async getSeleccionLink(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    const link = await this.seleccionAsientosService.getOrGenerarLink(reserva.id);
    return { seleccion_link: link };
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
        const tour = await this.tourRepository.findOne({ where: { id: dto.id_tour }, relations: ['precios_grupales'] });
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
    if (dto.vuelos !== undefined) needsValortotalRecalc = true;

    const nuevosHoteles = dto.hoteles !== undefined
      ? await this.buildHoteles(dto.hoteles)
      : undefined;
    if (dto.hoteles !== undefined) needsValortotalRecalc = true;

    if (dto.utilidad !== undefined) reserva.utilidad = dto.utilidad;

    if (dto.id_responsable !== undefined) {
      const responsable = await this.clienteRepository.findOne({ where: { id: dto.id_responsable } });
      if (!responsable) throw new NotFoundException(`Cliente con ID ${dto.id_responsable} no encontrado`);
      reserva.responsable = responsable;
    }

    if (dto.correo !== undefined) reserva.correo = dto.correo;
    if (dto.estado !== undefined) reserva.estado = dto.estado;
    if (dto.notas !== undefined) reserva.notas = dto.notas;
    if (dto.bus_layout_id !== undefined) reserva.bus_layout_id = dto.bus_layout_id ?? null;
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

    if (needsValortotalRecalc) {
      const newPersonas = 1 + (reserva.integrantes?.length ?? 0);
      const descuento = Number(reserva.descuento_por_persona ?? 0);
      let newTourSubtotal = 0;
      let newDescuentoTotal = 0;

      if (reserva.tour) {
        const modoPrecioUpdate = reserva.tour.modo_precio ?? (reserva.tour.precio_por_pareja ? 'pareja' : 'individual');
        const precioPorPareja = modoPrecioUpdate === 'pareja';
        const newUnits = precioPorPareja ? Math.ceil(newPersonas / 2) : newPersonas;

        if (modoPrecioUpdate === 'grupal') {
          const grupoActivo = (reserva.tour.precios_grupales ?? [])
            .filter((pg) => pg.activo)
            .find((pg) => newPersonas >= pg.min_personas && newPersonas <= pg.max_personas);
          newTourSubtotal = grupoActivo ? Number(grupoActivo.precio) : Number(reserva.tour.precio ?? 0) * newPersonas;
          reserva.precio_responsable_aplicado = grupoActivo ? Number(grupoActivo.precio) : null;
        } else {
          const usaPreciosCategorias =
            reserva.precio_responsable_aplicado != null ||
            (reserva.integrantes ?? []).some((i) => i.precio_aplicado != null);

          if (usaPreciosCategorias) {
            const precioResp = Number(reserva.precio_responsable_aplicado ?? 0);
            const ints = reserva.integrantes ?? [];
            newTourSubtotal = precioResp + ints.reduce((sum, i) => sum + Number(i.precio_aplicado ?? 0), 0);
            newDescuentoTotal = descuento * newUnits;
          } else if (tourChanged) {
            newTourSubtotal = Number(reserva.tour.precio ?? 0) * newUnits;
            newDescuentoTotal = descuento * newUnits;
          } else {
            // Tour no cambió: preservar precio unitario del snapshot
            const oldServiciosCost = originalServicios.reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
            const oldHotelesCost = (reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
            const oldVuelosCost = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
            const tourSubtotalSnapshot = snapshotValorSinDescuento - oldServiciosCost - oldHotelesCost - oldVuelosCost;
            const oldPersonas = 1 + originalIntegrantesCount;
            const oldUnits = precioPorPareja ? Math.ceil(oldPersonas / 2) : oldPersonas;
            const precioUnitSnapshot = oldUnits > 0 ? tourSubtotalSnapshot / oldUnits : Number(reserva.tour.precio ?? 0);
            newTourSubtotal = precioUnitSnapshot * newUnits;
            newDescuentoTotal = descuento * newUnits;
          }
        }
      }

      const newTotalHoteles = (nuevosHoteles ?? reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
      const newTotalVuelos = (nuevosVuelos ?? reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      const newCostoServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);

      reserva.valor_sin_descuento = newTourSubtotal + newTotalHoteles + newTotalVuelos + newCostoServicios;
      reserva.valor_total = reserva.valor_sin_descuento - newDescuentoTotal;
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
        precio_responsable_aplicado: reserva.precio_responsable_aplicado,
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

  async historialCliente(clienteId: number, rol?: string, userId?: number) {
    const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);

    const where: any = { responsable: { id: clienteId } };
    if (rol !== 'admin' && userId) {
      where.creado_por_id = userId;
    }

    const reservas = await this.reservaRepository.find({
      where,
      order: { fecha_creacion: 'DESC' },
    });

    // Pagos validados de todas las reservas (para calcular saldo)
    const reservaIds = reservas.map((r) => r.id);
    const todosPagos = reservaIds.length > 0
      ? await this.pagoRepository.find({
          where: { reserva_id: In(reservaIds), is_validated: true },
          select: ['reserva_id', 'monto'],
        })
      : [];
    const valorCanceladoMap = new Map<number, number>();
    for (const p of todosPagos) {
      const rid = p.reserva_id!;
      valorCanceladoMap.set(rid, (valorCanceladoMap.get(rid) ?? 0) + Number(p.monto));
    }

    const data = await Promise.all(
      reservas.map((r) => this.transformResponseWithSaldo(r, null, false, valorCanceladoMap)),
    );

    // Todos los pagos del cliente: por chat_id (teléfono) o por reservas vinculadas
    const pagosCliente = await this.pagoRepository.find({
      where: [
        ...(cliente.telefono ? [{ chat_id: cliente.telefono }] : []),
        ...(reservaIds.length > 0 ? [{ reserva_id: In(reservaIds) }] : []),
      ],
      order: { fecha_creacion: 'DESC' },
    });

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        correo: cliente.correo,
        telefono: cliente.telefono,
      },
      total_viajes: data.length,
      reservas: data,
      pagos: pagosCliente,
      total_pagos: pagosCliente.length,
      total_pagado: pagosCliente
        .filter((p) => p.is_validated)
        .reduce((sum, p) => sum + Number(p.monto), 0),
    };
  }

  async removeIntegrante(reservaId: number, integranteId: number, realizadoPor?: string, usuarioId?: number) {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId },
      relations: ['integrantes', 'tour', 'servicios', 'vuelos', 'hoteles'],
    });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${reservaId} no encontrada`);

    const integrante = await this.integranteRepository.findOne({
      where: { id: integranteId, reserva: { id: reservaId } },
    });
    if (!integrante) throw new NotFoundException(`Integrante con ID ${integranteId} no encontrado en esta reserva`);

    const nombreIntegrante = integrante.nombre;
    const ocupabaAsiento = integrante.ocupa_asiento !== false;

    // Calcular nuevos valores ANTES de iniciar la transacción (solo lectura)
    const integrantes = (reserva.integrantes ?? []).filter((i) => i.id !== integranteId);
    const newPersonas = 1 + integrantes.length;
    let nuevoValorSinDescuento = Number(reserva.valor_sin_descuento);
    let nuevoValorTotal = Number(reserva.valor_total);

    if (reserva.tipo_reserva === 'tour' && reserva.tour) {
      const precioPorPareja = reserva.tour.precio_por_pareja ?? false;
      const newUnits = precioPorPareja ? Math.ceil(newPersonas / 2) : newPersonas;
      const oldPersonas = 1 + (reserva.integrantes?.length ?? 0);
      const oldUnits = precioPorPareja ? Math.ceil(oldPersonas / 2) : oldPersonas;
      const serviciosCost = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);

      const usaPreciosCategorias =
        reserva.precio_responsable_aplicado != null ||
        integrantes.some((i) => i.precio_aplicado != null);

      if (usaPreciosCategorias) {
        const precioResp = Number(reserva.precio_responsable_aplicado ?? 0);
        let precioTotal: number;
        let unidades: number;
        if (precioPorPareja) {
          unidades = Math.ceil(newPersonas / 2);
          precioTotal = precioResp;
          for (let i = 1; i < integrantes.length; i += 2) {
            precioTotal += Number(integrantes[i].precio_aplicado ?? 0);
          }
        } else {
          unidades = newPersonas;
          precioTotal = precioResp + integrantes.reduce((sum, i) => sum + Number(i.precio_aplicado ?? 0), 0);
        }
        const descuento = Number(reserva.descuento_por_persona ?? 0);
        nuevoValorSinDescuento = precioTotal + serviciosCost;
        nuevoValorTotal = nuevoValorSinDescuento - descuento * unidades;
      } else {
        const tourSubtotalSnapshot = Number(reserva.valor_sin_descuento) - serviciosCost;
        const precioUnitSnapshot = oldUnits > 0 ? tourSubtotalSnapshot / oldUnits : Number(reserva.tour.precio ?? 0);
        const descuento = Number(reserva.descuento_por_persona ?? 0);
        nuevoValorSinDescuento = precioUnitSnapshot * newUnits + serviciosCost;
        nuevoValorTotal = nuevoValorSinDescuento - descuento * newUnits;
      }
    } else {
      const totalVuelos = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      const totalHoteles = (reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
      const totalServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      nuevoValorSinDescuento = totalVuelos + totalHoteles + totalServicios;
      nuevoValorTotal = nuevoValorSinDescuento;
    }

    // Transacción: eliminar integrante y actualizar totales son atómicos.
    // Si el servidor cae entre los dos, ninguno queda a medias.
    await this.dataSource.transaction(async (manager) => {
      await manager.remove(integrante);
      await manager.update(Reserva, { id: reservaId }, {
        valor_total: nuevoValorTotal,
        valor_sin_descuento: nuevoValorSinDescuento,
      });
    });

    // Liberar asiento más lejano (fuera de la tx: si falla, el valor_total ya está correcto
    // y el asiento extra se puede corregir manualmente sin riesgo financiero)
    let asiento_liberado: string | null = null;
    if (ocupabaAsiento) {
      asiento_liberado = await this.seleccionAsientosService.liberarAsientoMasLejano(reservaId);
    }

    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'reservas',
      operacion: 'ACTUALIZAR',
      documento_id: reservaId,
      detalle: { accion: 'eliminar_integrante', integrante: nombreIntegrante, nuevo_valor_total: nuevoValorTotal, asiento_liberado },
    });

    return {
      message: `Integrante "${nombreIntegrante}" eliminado correctamente`,
      nuevo_valor_total: nuevoValorTotal,
      asiento_liberado,
    };
  }

  async cambiarEstado(id: number, nuevoEstado: string, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    const estadoAnterior = reserva.estado;
    reserva.estado = nuevoEstado;
    const saved = await this.reservaRepository.save(reserva);

    // Al cancelar, liberar todos los asientos para que queden disponibles en el bus
    const esCancelacion = ['cancelada', 'cancelado'].includes(nuevoEstado.toLowerCase());
    if (esCancelacion) {
      await this.seleccionAsientosService.limpiarAsientos(id);
    }

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
        asientos_liberados: esCancelacion,
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

  async remove(id: number, realizadoPor?: string) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);

    const idReservaString = reserva.id_reserva;

    await this.reservaRepository.softDelete(id);

    await this.auditoriaGeneralService.registrar({
      usuario_id: null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'reservas',
      operacion: 'ELIMINAR',
      documento_id: idReservaString,
      detalle: { id_reserva: idReservaString, tipo_reserva: reserva.tipo_reserva, estado_anterior: reserva.estado, nota: 'Eliminado lógico' },
    });

    return { message: `Reserva con ID ${id} eliminada lógicamente` };
  }

  // --------------- helpers ---------------

  private async calcularCuposUsados(tourId: number): Promise<number> {
    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId } },
    });
    const activas = reservas.filter((r) => !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? ''));
    if (activas.length === 0) return 0;

    const pendientesIds = activas
      .filter((r) => r.estado !== 'al dia')
      .map((r) => r.id);

    const reservasConPago = new Set<number>();
    if (pendientesIds.length > 0) {
      const pagos = await this.pagoRepository
        .createQueryBuilder('p')
        .select('DISTINCT p.reserva_id', 'reserva_id')
        .where('p.reserva_id IN (:...ids)', { ids: pendientesIds })
        .andWhere('p.is_validated = true')
        .getRawMany<{ reserva_id: number }>();
      pagos.forEach((p) => reservasConPago.add(Number(p.reserva_id)));
    }

    return activas.reduce((total, r) => {
      const personas = 1 + (r.integrantes?.length ?? 0);
      if (r.estado === 'al dia' || reservasConPago.has(r.id)) {
        return total + personas;
      }
      return total;
    }, 0);
  }

  private async calcularCuposUsadosPorSalida(tourSalidaId: number): Promise<number> {
    const reservas = await this.reservaRepository.find({
      where: { tour_salida: { id: tourSalidaId } },
    });
    const activas = reservas.filter((r) => !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? ''));
    if (activas.length === 0) return 0;

    const pendientesIds = activas.filter((r) => r.estado !== 'al dia').map((r) => r.id);
    const reservasConPago = new Set<number>();
    if (pendientesIds.length > 0) {
      const pagos = await this.pagoRepository
        .createQueryBuilder('p')
        .select('DISTINCT p.reserva_id', 'reserva_id')
        .where('p.reserva_id IN (:...ids)', { ids: pendientesIds })
        .andWhere('p.is_validated = true')
        .getRawMany<{ reserva_id: number }>();
      pagos.forEach((p) => reservasConPago.add(Number(p.reserva_id)));
    }

    return activas.reduce((total, r) => {
      const personas = 1 + (r.integrantes?.length ?? 0);
      if (r.estado === 'al dia' || reservasConPago.has(r.id)) return total + personas;
      return total;
    }, 0);
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
          habitaciones: h.habitaciones ?? null,
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
    let tourSubtotal = 0;
    let descuentoTotal = 0;

    if (reserva.tour) {
      const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
      const descuento = Number(reserva.descuento_por_persona ?? 0);
      const modoPrecio = reserva.tour.modo_precio ?? (reserva.tour.precio_por_pareja ? 'pareja' : 'individual');
      const usaPreciosCategorias =
        reserva.precio_responsable_aplicado != null ||
        (reserva.integrantes ?? []).some((i) => i.precio_aplicado != null);

      if (modoPrecio === 'grupal') {
        const grupoActivo = (reserva.tour.precios_grupales ?? [])
          .filter((pg) => pg.activo)
          .find((pg) => totalPersonas >= pg.min_personas && totalPersonas <= pg.max_personas);
        tourSubtotal = grupoActivo
          ? Number(grupoActivo.precio)
          : Number(reserva.tour.precio ?? 0) * totalPersonas;
      } else if (usaPreciosCategorias) {
        const precioResp = Number(reserva.precio_responsable_aplicado ?? 0);
        const ints = reserva.integrantes ?? [];
        if (modoPrecio === 'pareja') {
          const unidades = Math.ceil(totalPersonas / 2);
          let precioTotal = precioResp;
          for (let i = 1; i < ints.length; i += 2) precioTotal += Number(ints[i].precio_aplicado ?? 0);
          tourSubtotal = precioTotal;
          descuentoTotal = descuento * unidades;
        } else {
          const unidades = totalPersonas;
          tourSubtotal = precioResp + ints.reduce((sum, i) => sum + Number(i.precio_aplicado ?? 0), 0);
          descuentoTotal = descuento * unidades;
        }
      } else {
        const unidades = modoPrecio === 'pareja' ? Math.ceil(totalPersonas / 2) : totalPersonas;
        tourSubtotal = Number(reserva.tour.precio ?? 0) * unidades;
        descuentoTotal = descuento * unidades;
      }
    }

    const totalHoteles = (reserva.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
    const totalVuelos = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
    const costoServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);

    const valor_sin_descuento = tourSubtotal + totalHoteles + totalVuelos + costoServicios;
    const valor_total = valor_sin_descuento - descuentoTotal;
    return { valor_sin_descuento, valor_total };
  }

  private async transformResponseWithSaldo(
    reserva: Reserva,
    agente: Usuario | null = null,
    fullTour = false,
    valorCanceladoMap?: Map<number, number>,
  ) {
    let pagosValidados: PagoRealizado[] = [];
    let valor_cancelado: number;

    if (valorCanceladoMap) {
      // Valor pre-cargado en batch — evita query individual por reserva
      valor_cancelado = valorCanceladoMap.get(reserva.id) ?? 0;
    } else {
      pagosValidados = await this.pagoRepository.find({
        where: { reserva_id: reserva.id, is_validated: true },
        order: { fecha_creacion: 'ASC' },
      });
      valor_cancelado = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);
    }

    // Tours grupales: siempre recalculamos (el precio grupal es fuente de verdad del tour, no snapshot histórico).
    // Tours con precios por categoría: recalculamos solo en detalle (fullTour).
    // Resto: usamos el valor almacenado (precio histórico acordado).
    const esGrupal = reserva.tour?.modo_precio === 'grupal';
    const usaPreciosCategorias =
      reserva.precio_responsable_aplicado != null ||
      (reserva.integrantes ?? []).some((i) => i.precio_aplicado != null);
    const useStored = !esGrupal && !usaPreciosCategorias;
    const { valor_sin_descuento, valor_total } = useStored
      ? { valor_sin_descuento: Number(reserva.valor_sin_descuento), valor_total: Number(reserva.valor_total) }
      : this.calcularValorReal(reserva);

    const saldo_pendiente = valor_total - valor_cancelado;

    const pagosData = fullTour
      ? pagosValidados.map((p) => ({
          id_pago: p.id_pago,
          monto: Number(p.monto),
          tipo_documento: p.tipo_documento,
          metodo_pago: p.metodo_pago,
          referencia: p.referencia,
          fecha_documento: p.fecha_documento,
          url_imagen: p.url_imagen,
          fecha_creacion: p.fecha_creacion,
        }))
      : undefined;

    const total_personas = 1 + (reserva.integrantes?.filter(i => i.ocupa_asiento !== false).length ?? 0);

    let valor_personas: number | undefined;
    if (fullTour && reserva.tour) {
      const modoPrecioVP = reserva.tour.modo_precio ?? (reserva.tour.precio_por_pareja ? 'pareja' : 'individual');
      if (modoPrecioVP === 'grupal') {
        const grupoActivoVP = (reserva.tour.precios_grupales ?? [])
          .filter((pg) => pg.activo)
          .find((pg) => total_personas >= pg.min_personas && total_personas <= pg.max_personas);
        valor_personas = grupoActivoVP ? Number(grupoActivoVP.precio) : 0;
      } else {
        const unidades = reserva.tour.precio_por_pareja
          ? Math.ceil(total_personas! / 2)
          : total_personas!;
        valor_personas = Number(reserva.tour.precio ?? 0) * unidades;
      }
    }

    const base = {
      ...this.transformResponse(reserva, agente, fullTour),
      valor_sin_descuento,
      valor_total,
      valor_cancelado,
      saldo_pendiente,
      total_personas,
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
      precio_responsable_id: reserva.precio_responsable_id,
      precio_responsable_aplicado: reserva.precio_responsable_aplicado,
      bus_layout_id: reserva.bus_layout_id,
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
              disponibilidad_tipo: reserva.tour.disponibilidad_tipo,
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
              descripcion: reserva.tour.descripcion ?? null,
              recomendaciones: reserva.tour.recomendaciones ?? null,
              es_promocion: reserva.tour.es_promocion,
              modo_precio: reserva.tour.modo_precio ?? 'individual',
              precios: (reserva.tour.precios ?? []).map((p) => ({
                id: p.id,
                descripcion: p.descripcion,
                precio: p.precio,
                edad_min: p.edad_min,
                edad_max: p.edad_max,
                punto_partida: p.punto_partida,
                activo: p.activo,
              })),
              precios_grupales: (reserva.tour.precios_grupales ?? []).map((pg) => ({
                id: pg.id,
                min_personas: pg.min_personas,
                max_personas: pg.max_personas,
                precio: pg.precio,
                descripcion: pg.descripcion,
                activo: pg.activo,
              })),
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
      fecha_inicio_personalizada: reserva.fecha_inicio_personalizada ?? null,
      fecha_fin_personalizada: reserva.fecha_fin_personalizada ?? null,
      id_tour_salida: reserva.tour_salida?.id ?? null,
      tour_salida: reserva.tour_salida
        ? {
            id: reserva.tour_salida.id,
            fecha_inicio: reserva.tour_salida.fecha_inicio,
            fecha_fin: reserva.tour_salida.fecha_fin,
            label: reserva.tour_salida.label ?? null,
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
        tour_precio_id: i.tour_precio_id,
        precio_aplicado: i.precio_aplicado,
        ocupa_asiento: i.ocupa_asiento ?? true,
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
        habitaciones: h.habitaciones ?? [],
      })),
    };
  }
}
