import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
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
    private readonly auditoriaService: AuditoriaReservaService,
  ) {}

  async create(dto: CreateReservaDto, realizadoPor?: string) {
    // 1. Validar el Tour
    const tour = await this.tourRepository.findOne({ where: { id: dto.id_tour } });
    if (!tour) {
      throw new NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);
    }

    // 2. Buscar servicios adiconales
    let serviciosAdicionales: Servicio[] = [];
    if (dto.servicios_ids && dto.servicios_ids.length > 0) {
      serviciosAdicionales = await this.servicioRepository.find({
        where: { id_servicio: In(dto.servicios_ids) },
      });
    }

    // 3. Generar un ID de reserva corto (ej. RES-...)
    const idReservaGenerado = `RES-${uuidv4().substring(0, 8).toUpperCase()}`;

    // 4. Calcular valor_total automáticamente
    const totalPersonas = 1 + (dto.integrantes?.length ?? 0);
    const precio = Number(tour.precio ?? 0);
    const precioTour = tour.precio_por_pareja
      ? precio * Math.ceil(totalPersonas / 2)
      : precio * totalPersonas;
    const costoServicios = serviciosAdicionales.reduce(
      (sum, s) => sum + Number(s.costo ?? 0),
      0,
    );
    const valorTotalCalculado = precioTour + costoServicios;

    // 5. Instanciar la Reserva con Integrantes y Relaciones
    const reserva = this.reservaRepository.create({
      id_reserva: idReservaGenerado,
      correo: dto.correo,
      estado: dto.estado ?? 'pendiente',
      valor_total: valorTotalCalculado,
      responsable_nombre: dto.responsable_nombre ?? null,
      responsable_telefono: dto.responsable_telefono ?? null,
      responsable_fecha_nacimiento: dto.responsable_fecha_nacimiento ?? null,
      responsable_cedula: dto.responsable_cedula ?? null,
      tour: tour,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes || [],
    });

    // 6. Guardar transaccionalmente
    const saved = await this.reservaRepository.save(reserva);

    // 7. Registrar en auditoría
    await this.auditoriaService.registrarCreacion(saved, realizadoPor);

    return this.transformResponse(saved);
  }

  async findAll() {
    const reservas = await this.reservaRepository.find({
      order: { fecha_creacion: 'DESC' },
    });
    return Promise.all(reservas.map((r) => this.transformResponseWithSaldo(r)));
  }

  async findOne(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
    return this.transformResponseWithSaldo(reserva);
  }

  async cambiarEstado(
    id: number,
    nuevoEstado: string,
    realizadoPor?: string,
  ) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    const estadoAnterior = reserva.estado;
    reserva.estado = nuevoEstado;
    const saved = await this.reservaRepository.save(reserva);

    // Registrar cambio en auditoría
    await this.auditoriaService.registrarCambioEstado(
      saved,
      estadoAnterior,
      nuevoEstado,
      realizadoPor,
    );

    return this.transformResponseWithSaldo(saved);
  }

  async actualizarInfo(
    id: number,
    datos: Partial<{
      correo: string;
      responsable_nombre: string;
      responsable_telefono: string;
      responsable_fecha_nacimiento: string;
      responsable_cedula: string;
    }>,
    realizadoPor?: string,
  ) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    const camposAuditables = ['correo', 'responsable_nombre', 'responsable_telefono', 'responsable_fecha_nacimiento', 'responsable_cedula'] as const;
    for (const campo of camposAuditables) {
      if (datos[campo] !== undefined && datos[campo] !== reserva[campo]) {
        await this.auditoriaService.registrarEdicion(
          reserva,
          campo,
          reserva[campo],
          datos[campo],
          realizadoPor,
        );
        (reserva as any)[campo] = datos[campo];
      }
    }

    const saved = await this.reservaRepository.save(reserva);
    return this.transformResponseWithSaldo(saved);
  }

  async obtenerAuditoria(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return this.auditoriaService.obtenerAuditoria(id);
  }

  private async transformResponseWithSaldo(reserva: Reserva) {
    // Recalcular valor_total dinámicamente
    const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
    const precio = Number(reserva.tour?.precio ?? 0);
    const precioTour = reserva.tour
      ? reserva.tour.precio_por_pareja
        ? precio * Math.ceil(totalPersonas / 2)
        : precio * totalPersonas
      : 0;
    const costoServicios = (reserva.servicios ?? []).reduce(
      (sum, s) => sum + Number(s.costo ?? 0),
      0,
    );
    const valor_total = precioTour + costoServicios;

    // Sumar solo pagos validados de esta reserva
    const pagosValidados = await this.pagoRepository.find({
      where: { reserva_id: reserva.id, is_validated: true },
      select: ['monto'],
    });
    const valor_cancelado = pagosValidados.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );
    const saldo_pendiente = valor_total - valor_cancelado;

    return {
      ...this.transformResponse(reserva),
      valor_total,
      valor_cancelado,
      saldo_pendiente,
    };
  }

  // Permite dar un formato limpio y cumplir con los requerimientos exactos
  private transformResponse(reserva: Reserva) {
    return {
      id: reserva.id,
      id_reserva: reserva.id_reserva,
      correo: reserva.correo,
      estado: reserva.estado,
      valor_total: reserva.valor_total,
      responsable_nombre: reserva.responsable_nombre,
      responsable_telefono: reserva.responsable_telefono,
      responsable_fecha_nacimiento: reserva.responsable_fecha_nacimiento,
      responsable_cedula: reserva.responsable_cedula,
      fecha_creacion: reserva.fecha_creacion,
      fecha_actualizacion: reserva.fecha_actualizacion,
      tour: reserva.tour ? {
        id: reserva.tour.id,
        nombre: reserva.tour.nombre_tour,
        fecha_inicio: reserva.tour.fecha_inicio,
        fecha_fin: reserva.tour.fecha_fin,
        precio: reserva.tour.precio,
        precio_por_pareja: reserva.tour.precio_por_pareja ?? false,
        es_promocion: reserva.tour.es_promocion,
      } : null,
      servicios_adicionales: reserva.servicios ? reserva.servicios.map(s => ({
        id_servicio: s.id_servicio,
        nombre_servicio: s.nombre_servicio,
        costo: s.costo,
        descripcion: s.descripcion,
      })) : [],
      integrantes: reserva.integrantes ? reserva.integrantes.map(i => ({
        id: i.id,
        nombre: i.nombre,
        telefono: i.telefono,
        fecha_nacimiento: i.fecha_nacimiento,
      })) : []
    };
  }
}
