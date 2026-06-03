import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class HotelesService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelesRepository: Repository<Hotel>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateHotelDto, usuarioId?: number, usuarioNombre?: string): Promise<Hotel> {
    const hotel = this.hotelesRepository.create({
      nombre: dto.nombre,
      telefono: dto.telefono ?? null,
      ciudad: dto.ciudad,
      direccion: dto.direccion ?? null,
      imagenes: dto.imagenes ?? null,
      habitaciones: dto.habitaciones ?? null,
    });
    const saved = await this.hotelesRepository.save(hotel);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      modulo: 'hoteles',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { nombre: saved.nombre, ciudad: saved.ciudad },
    });
    return saved;
  }

  findAll(): Promise<Hotel[]> {
    return this.hotelesRepository.find({
      where: { is_active: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelesRepository.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException(`Hotel con ID ${id} no encontrado`);
    return hotel;
  }

  async update(id: number, dto: UpdateHotelDto, usuarioId?: number, usuarioNombre?: string): Promise<Hotel> {
    const hotel = await this.findOne(id);
    const antes = { nombre: hotel.nombre, ciudad: hotel.ciudad, is_active: hotel.is_active };
    if (dto.nombre !== undefined) hotel.nombre = dto.nombre;
    if (dto.telefono !== undefined) hotel.telefono = dto.telefono;
    if (dto.ciudad !== undefined) hotel.ciudad = dto.ciudad;
    if (dto.direccion !== undefined) hotel.direccion = dto.direccion;
    if (dto.imagenes !== undefined) hotel.imagenes = dto.imagenes;
    if (dto.habitaciones !== undefined) hotel.habitaciones = dto.habitaciones;
    if (dto.is_active !== undefined) hotel.is_active = dto.is_active;
    const saved = await this.hotelesRepository.save(hotel);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      modulo: 'hoteles',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues: { nombre: saved.nombre, ciudad: saved.ciudad, is_active: saved.is_active } },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const hotel = await this.findOne(id);
    await this.hotelesRepository.update({ id }, { is_active: false });
    await this.auditoriaService.registrar({
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      modulo: 'hoteles',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre: hotel.nombre, ciudad: hotel.ciudad },
    });
    return { message: `Hotel con ID ${id} eliminado correctamente` };
  }
}
