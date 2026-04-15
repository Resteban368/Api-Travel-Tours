import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aerolinea } from './entities/aerolinea.entity';
import { CreateAerolineaDto } from './dto/create-aerolinea.dto';
import { UpdateAerolineaDto } from './dto/update-aerolinea.dto';

@Injectable()
export class AerolineasService {
  constructor(
    @InjectRepository(Aerolinea)
    private readonly aerolineaRepository: Repository<Aerolinea>,
  ) {}

  async create(dto: CreateAerolineaDto): Promise<Aerolinea> {
    const existe = await this.aerolineaRepository.findOne({
      where: { codigo_iata: dto.codigo_iata.toUpperCase() },
    });
    if (existe) {
      throw new ConflictException(`Ya existe una aerolínea con el código IATA ${dto.codigo_iata}`);
    }
    const aerolinea = this.aerolineaRepository.create({
      ...dto,
      codigo_iata: dto.codigo_iata.toUpperCase(),
    });
    return this.aerolineaRepository.save(aerolinea);
  }

  findAll(): Promise<Aerolinea[]> {
    return this.aerolineaRepository.find({
      where: { is_active: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Aerolinea> {
    const aerolinea = await this.aerolineaRepository.findOne({ where: { id } });
    if (!aerolinea) throw new NotFoundException(`Aerolínea con ID ${id} no encontrada`);
    return aerolinea;
  }

  async update(id: number, dto: UpdateAerolineaDto): Promise<Aerolinea> {
    const aerolinea = await this.findOne(id);
    if (dto.codigo_iata) {
      dto.codigo_iata = dto.codigo_iata.toUpperCase();
    }
    Object.assign(aerolinea, dto);
    return this.aerolineaRepository.save(aerolinea);
  }
}
