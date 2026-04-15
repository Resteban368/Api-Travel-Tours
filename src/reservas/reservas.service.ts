import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  ) {}

  async create(dto: CreateReservaDto, realizadoPor?: string) {
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

    if (dto.valor_total === undefined) {
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
      responsable,
      tour,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes ?? [],
      vuelos: vuelosEntidades,
    });

    const saved = await this.reservaRepository.save(reserva);
    await this.auditoriaService.registrarCreacion(saved, realizadoPor);
    return this.transformResponse(saved);
  }

  async findAll(page = 1, limit = 20) {
    const [reservas, total] = await this.reservaRepository.findAndCount({
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

    if (dto.tipo_reserva !== undefined) {
      reserva.tipo_reserva = dto.tipo_reserva;
    }

    if (dto.id_tour !== undefined) {
      if (dto.id_tour === null) {
        reserva.tour = null;
      } else {
        const tour = await this.tourRepository.findOne({ where: { id: dto.id_tour } });
        if (!tour) throw new NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);
        reserva.tour = tour;
        needsValortotalRecalc = true;
      }
    }

    if (dto.vuelos !== undefined) {
      await this.vueloRepository.delete({ reserva: { id } });
      reserva.vuelos = await this.buildVuelos(dto.vuelos);
    }

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

    if (dto.integrantes !== undefined) {
      await this.integranteRepository.delete({ reserva: { id } });
      reserva.integrantes = dto.integrantes.map((i) => this.integranteRepository.create(i));
      needsValortotalRecalc = true;
    }

    if (dto.valor_total !== undefined) {
      reserva.valor_total = dto.valor_total;
    } else if (needsValortotalRecalc) {
      const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
      if (reserva.tipo_reserva === 'tour' && reserva.tour) {
        const precio = Number(reserva.tour.precio ?? 0);
        const precioTour = reserva.tour.precio_por_pareja
          ? precio * Math.ceil(totalPersonas / 2)
          : precio * totalPersonas;
        const costoServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
        reserva.valor_total = precioTour + costoServicios;
      } else if (reserva.tipo_reserva === 'vuelos') {
        reserva.valor_total = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
      }
    }

    const saved = await this.reservaRepository.save(reserva);
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
    const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
    let valor_total = Number(reserva.valor_total);

    if (reserva.tipo_reserva === 'tour' && reserva.tour) {
      const precio = Number(reserva.tour.precio ?? 0);
      const precioTour = reserva.tour.precio_por_pareja
        ? precio * Math.ceil(totalPersonas / 2)
        : precio * totalPersonas;
      const costoServicios = (reserva.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
      valor_total = precioTour + costoServicios;
    } else if (reserva.tipo_reserva === 'vuelos') {
      valor_total = (reserva.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
    }

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
