import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodoPago } from './entities/metodo-pago.entity';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class MetodosPagoService {
  constructor(
    @InjectRepository(MetodoPago)
    private readonly metodosPagoRepository: Repository<MetodoPago>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(createDto: CreateMetodoPagoDto, usuarioId?: number, usuarioNombre?: string): Promise<MetodoPago> {
    const metodo = this.metodosPagoRepository.create(createDto);
    const saved = await this.metodosPagoRepository.save(metodo);
    await this.syncAllPaymentMethodsToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'metodos-pago',
      operacion: 'CREAR',
      documento_id: saved.id_metodo_pago,
      detalle: { nombre_metodo: saved.nombre_metodo, tipo_pago: saved.tipo_pago },
    });
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
    usuarioId?: number,
    usuarioNombre?: string,
  ): Promise<MetodoPago> {
    const metodo = await this.findOne(id);
    const antes = { nombre_metodo: metodo.nombre_metodo, tipo_pago: metodo.tipo_pago, tipo_cuenta: metodo.tipo_cuenta, numero_metodo: metodo.numero_metodo, titular_cuenta: metodo.titular_cuenta, activo: metodo.activo };
    Object.assign(metodo, updateDto);
    const saved = await this.metodosPagoRepository.save(metodo);
    await this.syncAllPaymentMethodsToVector();
    const despues = { nombre_metodo: saved.nombre_metodo, tipo_pago: saved.tipo_pago, tipo_cuenta: saved.tipo_cuenta, numero_metodo: saved.numero_metodo, titular_cuenta: saved.titular_cuenta, activo: saved.activo };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'metodos-pago',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const metodo = await this.findOne(id);
    await this.metodosPagoRepository.remove(metodo);
    await this.syncAllPaymentMethodsToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'metodos-pago',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre_metodo: metodo.nombre_metodo, tipo_pago: metodo.tipo_pago },
    });
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
