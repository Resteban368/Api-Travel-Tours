import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliticaReserva } from './entities/politica-reserva.entity';
import { CreatePoliticaReservaDto, UpdatePoliticaReservaDto } from './dto/politicas-reserva.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class PoliticasReservaService {
  constructor(
    @InjectRepository(PoliticaReserva)
    private readonly politicaRepository: Repository<PoliticaReserva>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async create(dto: CreatePoliticaReservaDto): Promise<PoliticaReserva> {
    const politica = this.politicaRepository.create(dto);
    const saved = await this.politicaRepository.save(politica);
    await this.syncAllPoliticasToVector();
    return saved;
  }

  async findAll(): Promise<PoliticaReserva[]> {
    return await this.politicaRepository.find({
      order: { tipo_politica: 'ASC', id_politica: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PoliticaReserva> {
    const politica = await this.politicaRepository.findOne({
      where: { id_politica: id },
    });
    if (!politica) {
      throw new NotFoundException(`Política con ID ${id} no encontrada`);
    }
    return politica;
  }

  async update(id: number, dto: UpdatePoliticaReservaDto): Promise<PoliticaReserva> {
    const politica = await this.findOne(id);
    Object.assign(politica, dto);
    const saved = await this.politicaRepository.save(politica);
    await this.syncAllPoliticasToVector();
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const politica = await this.findOne(id);
    await this.politicaRepository.remove(politica);
    await this.syncAllPoliticasToVector();
    return { message: `Política con ID ${id} eliminada correctamente` };
  }

  /**
   * Consolida todas las políticas activas en un único vector.
   */
  async syncAllPoliticasToVector(): Promise<void> {
    const politicas = await this.politicaRepository.find({
      where: { activo: true },
      order: { tipo_politica: 'ASC', id_politica: 'ASC' },
    });

    if (politicas.length === 0) {
      // Si no hay políticas, podríamos opcionalmente borrar el vector
      return;
    }

    // Generar el bloque de texto consolidado
    const textSections = politicas.map((p) => {
      return `POLÍTICA DE ${p.tipo_politica.toUpperCase()}: ${p.titulo}\nDESCRIPCIÓN: ${p.descripcion}`;
    });

    const fullText = `INFORMACIÓN CONSOLIDADA DE POLÍTICAS DE RESERVA Y CANCELACIÓN:\n\n${textSections.join('\n\n---\n\n')}`;

    // Generar embedding (3072 dimensiones)
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_politicas_reserva',
      total_politicas: politicas.length,
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar y actualizar o crear el vector en n8n_vectors
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_politicas_reserva' })
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
