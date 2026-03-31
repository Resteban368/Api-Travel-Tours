import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';

/** Campos que se auditan campo-a-campo en cada PATCH */
const CAMPOS_AUDITABLES: (keyof UpdatePagoRealizadoDto)[] = [
  'chat_id',
  'tipo_documento',
  'monto',
  'proveedor_comercio',
  'nit',
  'metodo_pago',
  'referencia',
  'fecha_documento',
  'is_validated',
  'url_imagen',
];

@Injectable()
export class PagosRealizadosService {
  constructor(
    @InjectRepository(PagoRealizado)
    private readonly pagosRepository: Repository<PagoRealizado>,

    @InjectRepository(AuditoriaPago)
    private readonly auditoriaRepository: Repository<AuditoriaPago>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(createDto: CreatePagoRealizadoDto, realizadoPor?: string): Promise<PagoRealizado> {
    const existing = await this.pagosRepository.findOne({
      where: { referencia: createDto.referencia },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un pago con la referencia ${createDto.referencia}`,
      );
    }

    const pago = this.pagosRepository.create(createDto);
    const pagoCreado = await this.pagosRepository.save(pago);

    // Auditoría de CREACIÓN
    await this.auditoriaRepository.insert({
      id_pago: pagoCreado.id_pago,
      accion: 'CREACION',
      realizado_por: realizadoPor ?? null,
    });

    return pagoCreado;
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(startDate?: string, endDate?: string): Promise<PagoRealizado[]> {
    const where: any = {};

    if (startDate && endDate) {
      where.fecha_creacion = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.fecha_creacion = Between(new Date(startDate), new Date());
    }

    return await this.pagosRepository.find({
      where,
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PagoRealizado> {
    const pago = await this.pagosRepository.findOne({
      where: { id_pago: id },
    });
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return pago;
  }

  // ─── UPDATE (con auditoría) ────────────────────────────────────────────────

  async update(
    id: number,
    updateDto: UpdatePagoRealizadoDto,
    realizadoPor?: string,
  ): Promise<PagoRealizado> {
    const pago = await this.findOne(id);

    if (updateDto.referencia && updateDto.referencia !== pago.referencia) {
      const existing = await this.pagosRepository.findOne({
        where: { referencia: updateDto.referencia },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un pago con la referencia ${updateDto.referencia}`,
        );
      }
    }

    // Capturar cambios ANTES de aplicar el update
    const registrosAuditoria: Partial<AuditoriaPago>[] = [];

    for (const campo of CAMPOS_AUDITABLES) {
      if (campo in updateDto && updateDto[campo] !== undefined) {
        const valorAnterior = pago[campo as keyof PagoRealizado];
        const valorNuevo = updateDto[campo];

        // Solo auditar si el valor realmente cambió
        if (String(valorAnterior) !== String(valorNuevo)) {
          const accion = campo === 'is_validated' ? 'VALIDACION' : 'EDICION';
          registrosAuditoria.push({
            id_pago: id,
            accion,
            campo_modificado: campo,
            valor_anterior: valorAnterior !== null && valorAnterior !== undefined
              ? String(valorAnterior)
              : null,
            valor_nuevo: valorNuevo !== null && valorNuevo !== undefined
              ? String(valorNuevo)
              : null,
            realizado_por: realizadoPor ?? null,
          });
        }
      }
    }

    // Aplicar cambios y guardar
    Object.assign(pago, updateDto);
    const pagoActualizado = await this.pagosRepository.save(pago);

    // Insertar auditoría (en paralelo, no bloquea la respuesta)
    if (registrosAuditoria.length > 0) {
      await this.auditoriaRepository.insert(registrosAuditoria);
    }

    return pagoActualizado;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: number, realizadoPor?: string): Promise<{ message: string }> {
    const pago = await this.findOne(id);
    
    // Auditoría de ELIMINACIÓN
    await this.auditoriaRepository.insert({
      id_pago: id,
      accion: 'ELIMINACION',
      realizado_por: realizadoPor ?? null,
    });

    await this.pagosRepository.remove(pago);
    return { message: `Pago con ID ${id} eliminado correctamente` };
  }

  // ─── AUDITORÍA ────────────────────────────────────────────────────────────

  async findAuditoria(
    idPago?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<AuditoriaPago[]> {
    const where: FindOptionsWhere<AuditoriaPago> = {};

    if (idPago) {
      where.id_pago = idPago;
    }

    if (startDate && endDate) {
      where.fecha_auditoria = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.fecha_auditoria = Between(new Date(startDate), new Date());
    }

    return await this.auditoriaRepository.find({
      where,
      order: { fecha_auditoria: 'DESC' },
    });
  }
}
