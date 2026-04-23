import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from './dto/faqs.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(createDto: CreateFaqDto, usuarioId?: number, usuarioNombre?: string): Promise<Faq> {
    const faq = this.faqRepository.create(createDto);
    const saved = await this.faqRepository.save(faq);
    await this.syncAllFaqsToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'faqs',
      operacion: 'CREAR',
      documento_id: saved.id_faq,
      detalle: { pregunta: saved.pregunta },
    });
    return saved;
  }

  async findAll(): Promise<Faq[]> {
    return await this.faqRepository.find({
      order: { id_faq: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Faq> {
    const faq = await this.faqRepository.findOne({
      where: { id_faq: id },
    });
    if (!faq) {
      throw new NotFoundException(`FAQ con ID ${id} no encontrado`);
    }
    return faq;
  }

  async update(id: number, updateDto: UpdateFaqDto, usuarioId?: number, usuarioNombre?: string): Promise<Faq> {
    const faq = await this.findOne(id);
    const antes = { pregunta: faq.pregunta, respuesta: faq.respuesta, activo: faq.activo };
    Object.assign(faq, updateDto);
    const saved = await this.faqRepository.save(faq);
    await this.syncAllFaqsToVector();
    const despues = { pregunta: saved.pregunta, respuesta: saved.respuesta, activo: saved.activo };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'faqs',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
    await this.syncAllFaqsToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'faqs',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { pregunta: faq.pregunta },
    });
    return { message: `FAQ con ID ${id} eliminado correctamente` };
  }

  /**
   * Consolida todas las preguntas frecuentes activas en un único vector.
   */
  async syncAllFaqsToVector(): Promise<void> {
    const faqs = await this.faqRepository.find({
      where: { activo: true },
      order: { id_faq: 'ASC' },
    });

    if (faqs.length === 0) {
      // Opcional: eliminar el vector si no hay FAQs
      return;
    }

    // Generar texto consolidado
    const text = faqs
      .map((f) => {
        return `PREGUNTA: ${f.pregunta}\nRESPUESTA: ${f.respuesta}`;
      })
      .join('\n\n---\n\n');

    const fullText = `BASE DE CONOCIMIENTO - PREGUNTAS FRECUENTES (FAQs):\n\n${text}`;

    // Generar embedding
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_faqs',
      total_faqs: faqs.length,
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar si ya existe el vector consolidado usando QueryBuilder para JSONB
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_faqs' })
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
