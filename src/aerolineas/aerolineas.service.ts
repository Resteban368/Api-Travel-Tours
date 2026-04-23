import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aerolinea } from './entities/aerolinea.entity';
import { CreateAerolineaDto } from './dto/create-aerolinea.dto';
import { UpdateAerolineaDto } from './dto/update-aerolinea.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class AerolineasService {
  constructor(
    @InjectRepository(Aerolinea)
    private readonly aerolineaRepository: Repository<Aerolinea>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateAerolineaDto, usuarioId?: number, usuarioNombre?: string): Promise<Aerolinea> {
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
    const saved = await this.aerolineaRepository.save(aerolinea);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'aerolineas',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { nombre: saved.nombre, codigo_iata: saved.codigo_iata },
    });
    return saved;
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

  async update(id: number, dto: UpdateAerolineaDto, usuarioId?: number, usuarioNombre?: string): Promise<Aerolinea> {
    const aerolinea = await this.findOne(id);
    const antes = { nombre: aerolinea.nombre, codigo_iata: aerolinea.codigo_iata, pais: aerolinea.pais, logo_url: aerolinea.logo_url, is_active: aerolinea.is_active };
    if (dto.codigo_iata) {
      dto.codigo_iata = dto.codigo_iata.toUpperCase();
    }
    Object.assign(aerolinea, dto);
    const saved = await this.aerolineaRepository.save(aerolinea);
    const despues = { nombre: saved.nombre, codigo_iata: saved.codigo_iata, pais: saved.pais, logo_url: saved.logo_url, is_active: saved.is_active };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'aerolineas',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }
}
