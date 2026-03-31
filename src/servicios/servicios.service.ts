import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicios.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async create(createDto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.servicioRepository.create(createDto);
    const saved = await this.servicioRepository.save(servicio);
    await this.syncAllServiciosToVector();
    return saved;
  }

  async findAll(): Promise<Servicio[]> {
    return await this.servicioRepository.find({
      order: { id_servicio: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { id_servicio: id },
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return servicio;
  }

  async update(id: number, updateDto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.findOne(id);
    Object.assign(servicio, updateDto);
    const saved = await this.servicioRepository.save(servicio);
    await this.syncAllServiciosToVector();
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const servicio = await this.findOne(id);
    await this.servicioRepository.remove(servicio);
    await this.syncAllServiciosToVector();
    return { message: `Servicio con ID ${id} eliminado correctamente` };
  }

  /**
   * Consolida todos los servicios activos en un único vector.
   */
  async syncAllServiciosToVector(): Promise<void> {
    const servicios = await this.servicioRepository.find({
      where: { activo: true },
      order: { id_servicio: 'ASC' },
    });

    if (servicios.length === 0) return;

    // Generar texto consolidado
    const text = servicios
      .map((s) => {
        const parts = [
          `SERVICIO: ${s.nombre_servicio}`,
          s.descripcion ? `Descripción: ${s.descripcion}` : '',
          s.costo ? `Costo: $${s.costo}` : 'Costo: No especificado',
          `Sede ID: ${s.id_sede}`,
        ].filter(Boolean);
        return parts.join('\n');
      })
      .join('\n\n---\n\n');

    const fullText = `CATÁLOGO CONSOLIDADO DE SERVICIOS ADICIONALES:\n\n${text}`;

    // Generar embedding
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_servicios',
      total_servicios: servicios.length,
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar si ya existe el vector consolidado usando QueryBuilder para JSONB
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_servicios' })
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
