import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
  ) {}

  create(createCotizacionDto: CreateCotizacionDto) {
    const newCotizacion = this.cotizacionRepository.create(createCotizacionDto);
    return this.cotizacionRepository.save(newCotizacion);
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.cotizacionRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const cotizacion = await this.cotizacionRepository.findOne({ where: { id } });
    if (!cotizacion) {
      throw new NotFoundException(`Cotización con id ${id} no encontrada`);
    }
    return cotizacion;
  }

  async update(id: number, updateCotizacionDto: UpdateCotizacionDto) {
    const cotizacion = await this.findOne(id);
    const updatedCotizacion = this.cotizacionRepository.merge(cotizacion, updateCotizacionDto);
    return this.cotizacionRepository.save(updatedCotizacion);
  }

  async remove(id: number) {
    const cotizacion = await this.findOne(id);
    return this.cotizacionRepository.remove(cotizacion);
  }
}
