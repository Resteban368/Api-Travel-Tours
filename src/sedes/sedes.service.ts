import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sede } from './entities/sede.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepository: Repository<Sede>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateSedeDto, usuarioId?: number, usuarioNombre?: string): Promise<Sede> {
    const sede = this.sedeRepository.create(dto);
    const saved = await this.sedeRepository.save(sede);
    await this.syncAllSedesToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'sedes',
      operacion: 'CREAR',
      documento_id: saved.id_sede,
      detalle: { nombre_sede: saved.nombre_sede, direccion: saved.direccion },
    });
    return saved;
  }

  async findAll(): Promise<Sede[]> {
    return this.sedeRepository.find({
      order: { id_sede: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Sede> {
    const sede = await this.sedeRepository.findOne({
      where: { id_sede: id },
    });
    if (!sede) {
      throw new NotFoundException(`Sede con id ${id} no encontrada`);
    }
    return sede;
  }

  async update(id: number, dto: UpdateSedeDto, usuarioId?: number, usuarioNombre?: string): Promise<Sede> {
    const sede = await this.findOne(id);
    const antes = { nombre_sede: sede.nombre_sede, direccion: sede.direccion, telefono: sede.telefono, link_map: sede.link_map, is_active: sede.is_active };
    Object.assign(sede, dto);
    const saved = await this.sedeRepository.save(sede);
    await this.syncAllSedesToVector();
    const despues = { nombre_sede: saved.nombre_sede, direccion: saved.direccion, telefono: saved.telefono, link_map: saved.link_map, is_active: saved.is_active };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'sedes',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<void> {
    const sede = await this.findOne(id);
    await this.sedeRepository.remove(sede);
    await this.syncAllSedesToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'sedes',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre_sede: sede.nombre_sede, direccion: sede.direccion },
    });
  }

  /**
   * Consolida la información de todas las sedes activas en un único vector.
   * Esto sirve para que n8n pueda responder sobre cualquier sede con un solo contexto.
   */
  async syncAllSedesToVector(): Promise<void> {
    const sedes = await this.sedeRepository.find({
      where: { is_active: true },
      order: { id_sede: 'ASC' },
    });

    if (sedes.length === 0) return;

    // Generar texto descriptivo consolidado
    const text = sedes
      .map((s) => {
        const parts = [
          `SEDE: ${s.nombre_sede}`,
          s.direccion ? `Dirección: ${s.direccion}` : '',
          s.telefono ? `Teléfono: ${s.telefono}` : '',
          s.link_map ? `Link de Google Maps: ${s.link_map}` : '',
        ].filter(Boolean);
        return parts.join('\n');
      })
      .join('\n\n---\n\n');

    const fullText = `INFORMACIÓN CONSOLIDADA DE TODAS LAS SEDES DE LA AGENCIA:\n\n${text}`;

    // Generar embedding
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_sedes',
      total_sedes: sedes.length,
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar si ya existe el vector consolidado usando el operador ->> de Postgres para JSONB
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_sedes' })
      .getOne();

    if (existingVector) {
      existingVector.text = fullText;
      existingVector.embedding = embedding;
      existingVector.metadata = metadata;
      existingVector.modifiedTime = new Date();
      await this.n8nVectorRepository.save(existingVector);
    } else {
      const newVector = this.n8nVectorRepository.create({
        text: fullText,
        embedding,
        metadata,
        modifiedTime: new Date(),
      });
      await this.n8nVectorRepository.save(newVector);
    }
  }
}
