import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodoPago } from './entities/metodo-pago.entity';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class MetodosPagoService {
  constructor(
    @InjectRepository(MetodoPago)
    private readonly metodosPagoRepository: Repository<MetodoPago>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async create(createDto: CreateMetodoPagoDto): Promise<MetodoPago> {
    const metodo = this.metodosPagoRepository.create(createDto);
    const saved = await this.metodosPagoRepository.save(metodo);
    await this.syncAllPaymentMethodsToVector();
    return saved;
  }

  async findAll(): Promise<MetodoPago[]> {
    return await this.metodosPagoRepository.find({
      order: { id_metodo_pago: 'DESC' },
    });
  }

  async findOne(id: number): Promise<MetodoPago> {
    const metodo = await this.metodosPagoRepository.findOne({
      where: { id_metodo_pago: id },
    });
    if (!metodo) {
      throw new NotFoundException(`Método de pago con ID ${id} no encontrado`);
    }
    return metodo;
  }

  async update(
    id: number,
    updateDto: UpdateMetodoPagoDto,
  ): Promise<MetodoPago> {
    const metodo = await this.findOne(id);
    Object.assign(metodo, updateDto);
    const saved = await this.metodosPagoRepository.save(metodo);
    await this.syncAllPaymentMethodsToVector();
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const metodo = await this.findOne(id);
    await this.metodosPagoRepository.remove(metodo);
    await this.syncAllPaymentMethodsToVector();
    return { message: `Método de pago con ID ${id} eliminado correctamente` };
  }

  /**
   * Consolida la información de todos los métodos de pago activos en un único vector.
   */
  async syncAllPaymentMethodsToVector(): Promise<void> {
    const metodos = await this.metodosPagoRepository.find({
      where: { activo: true },
      order: { nombre_metodo: 'ASC' },
    });

    if (metodos.length === 0) return;

    // Generar texto descriptivo consolidado
    const text = metodos
      .map((m) => {
        const parts = [
          `MÉTODO: ${m.nombre_metodo}`,
          `Tipo de Pago: ${m.tipo_pago}`,
          m.tipo_cuenta ? `Tipo de Cuenta: ${m.tipo_cuenta}` : '',
          `Número/Cuenta: ${m.numero_metodo}`,
          `Titular de la cuenta: ${m.titular_cuenta}`,
        ].filter(Boolean);
        return parts.join('\n');
      })
      .join('\n\n---\n\n');

    const fullText = `INFORMACIÓN CONSOLIDADA DE MÉTODOS DE PAGO PARA RESERVAS:\n\n${text}`;

    // Generar embedding
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_metodos_pago',
      total_metodos: metodos.length,
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar si ya existe el vector consolidado usando el operador ->> de Postgres para JSONB
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", {
        tipo: 'consolidado_metodos_pago',
      })
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
