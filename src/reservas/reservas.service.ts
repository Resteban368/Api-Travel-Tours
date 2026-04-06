import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
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
  ) {}

  async create(dto: CreateReservaDto) {
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

    // 4. Instanciar la Reserva con Integrantes y Relaciones
    const reserva = this.reservaRepository.create({
      id_reserva: idReservaGenerado,
      correo: dto.correo,
      estado: dto.estado ?? 'pendiente',
      tour: tour,
      servicios: serviciosAdicionales,
      integrantes: dto.integrantes || [],
    });

    // 5. Guardar transaccionalmente
    const saved = await this.reservaRepository.save(reserva);

    return this.transformResponse(saved);
  }

  async findAll() {
    const reservas = await this.reservaRepository.find({
      order: { fecha_creacion: 'DESC' },
    });
    return reservas.map((r) => this.transformResponse(r));
  }

  async findOne(id: number) {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
    return this.transformResponse(reserva);
  }

  // Permite dar un formato limpio y cumplir con los requerimientos exactos
  private transformResponse(reserva: Reserva) {
    return {
      id: reserva.id,
      id_reserva: reserva.id_reserva,
      correo: reserva.correo,
      estado: reserva.estado,
      fecha_creacion: reserva.fecha_creacion,
      fecha_actualizacion: reserva.fecha_actualizacion,
      tour: reserva.tour ? {
        id: reserva.tour.id,
        nombre: reserva.tour.nombre_tour,
        fecha_inicio: reserva.tour.fecha_inicio,
        fecha_fin: reserva.tour.fecha_fin,
        precio: reserva.tour.precio,
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
