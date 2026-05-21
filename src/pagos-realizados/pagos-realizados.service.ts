import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

/** Campos que se auditan campo-a-campo en cada PATCH */
const CAMPOS_AUDITABLES: (keyof UpdatePagoRealizadoDto)[] = [
  'chat_id',
  'entidad_tipo',
  'monto',
  'metodo_pago',
  'referencia',
  'fecha_documento',
  'is_validated',
  'is_rechazado',
  'motivo_rechazo',
  'url_imagen',
  'reserva_id',
  'proveedor_id',
  'concepto',
  'cliente_nombre',
  'cliente_identificacion',
];

@Injectable()
export class PagosRealizadosService {
  constructor(
    @InjectRepository(PagoRealizado)
    private readonly pagosRepository: Repository<PagoRealizado>,

    @InjectRepository(AuditoriaPago)
    private readonly auditoriaRepository: Repository<AuditoriaPago>,

    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,

    private readonly dataSource: DataSource,
    private readonly auditoriaGeneralService: AuditoriaGeneralService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(createDto: CreatePagoRealizadoDto, realizadoPor?: string, usuarioId?: number): Promise<PagoRealizado> {
    // Validación de referencia según método de pago
    if (createDto.metodo_pago !== 'efectivo' && !createDto.referencia) {
      throw new BadRequestException('referencia es obligatoria cuando el método de pago no es efectivo');
    }
    if (!createDto.referencia) {
      createDto.referencia = `EFE-${Date.now()}-${randomUUID().slice(0, 8)}`;
    }

    // Pagos creados directamente via API quedan validados por defecto
    createDto.is_validated = true;

    // Validaciones condicionales por entidad_tipo
    if (createDto.entidad_tipo === 'reserva') {
      if (!createDto.reserva_id) {
        throw new BadRequestException('reserva_id es obligatorio cuando entidad_tipo es "reserva"');
      }
      createDto.concepto = 'reserva';
    } else if (createDto.entidad_tipo === 'proveedor') {
      if (!createDto.proveedor_id) {
        throw new BadRequestException('proveedor_id es obligatorio cuando entidad_tipo es "proveedor"');
      }
    }

    const existing = await this.pagosRepository.findOne({
      where: { referencia: createDto.referencia },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un pago con la referencia ${createDto.referencia}`,
      );
    }

    // Separar las FKs para evitar conflicto con los objetos de relación en TypeORM
    const { reserva_id, proveedor_id, ...rest } = createDto;
    const pago = this.pagosRepository.create(rest);
    if (reserva_id !== undefined) {
      pago.reserva_id = reserva_id ?? null;
    }
    if (proveedor_id !== undefined) {
      pago.proveedor_id = proveedor_id ?? null;
    }
    const pagoCreado = await this.pagosRepository.save(pago);

    // Auditoría de CREACIÓN
    await this.auditoriaRepository.insert({
      id_pago: pagoCreado.id_pago,
      accion: 'CREACION',
      realizado_por: realizadoPor ?? null,
    });
    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'pagos-realizados',
      operacion: 'CREAR',
      documento_id: pagoCreado.id_pago,
      detalle: { referencia: pagoCreado.referencia, monto: pagoCreado.monto, metodo_pago: pagoCreado.metodo_pago, entidad_tipo: pagoCreado.entidad_tipo, reserva_id: pagoCreado.reserva_id, proveedor_id: pagoCreado.proveedor_id },
    });

    return pagoCreado;
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(startDate?: string, endDate?: string, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.pagosRepository.createQueryBuilder('pago');

    if (startDate && endDate) {
      queryBuilder.andWhere('pago.fecha_creacion BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('pago.fecha_creacion >= :start', {
        start: new Date(startDate),
      });
    }

    if (search) {
      queryBuilder.leftJoin('proveedores', 'prov', 'prov.id = pago.proveedor_id');
      queryBuilder.andWhere(
        `(pago.referencia ILIKE :search
          OR pago.metodo_pago ILIKE :search
          OR pago.chat_id ILIKE :search
          OR pago.cliente_nombre ILIKE :search
          OR pago.cliente_identificacion ILIKE :search
          OR pago.concepto ILIKE :search
          OR pago.entidad_tipo ILIKE :search
          OR prov.nombre ILIKE :search
          OR prov.nit ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('pago.fecha_creacion', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    usuarioId?: number,
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

    // Validaciones condicionales por entidad_tipo en update
    if (updateDto.entidad_tipo === 'reserva' && updateDto.reserva_id === undefined && !pago.reserva_id) {
      throw new BadRequestException('reserva_id es obligatorio cuando entidad_tipo es "reserva"');
    }
    if (updateDto.entidad_tipo === 'proveedor' && updateDto.proveedor_id === undefined && !pago.proveedor_id) {
      throw new BadRequestException('proveedor_id es obligatorio cuando entidad_tipo es "proveedor"');
    }
    if (updateDto.entidad_tipo === 'reserva') {
      updateDto.concepto = 'reserva';
    }

    // Construir objeto de actualización sólo con los campos presentes en el DTO
    // Se usa repository.update() (SQL directo) para evitar que TypeORM sobreescriba
    // la FK reserva_id a null al hacer save() con la relación no cargada.
    const updatePayload: Partial<PagoRealizado> = {};
    const columnasDirectas: (keyof UpdatePagoRealizadoDto)[] = [
      'chat_id', 'entidad_tipo', 'monto',
      'metodo_pago', 'referencia', 'fecha_documento',
      'is_validated', 'is_rechazado', 'motivo_rechazo', 'url_imagen',
      'reserva_id', 'proveedor_id', 'concepto', 'cliente_nombre', 'cliente_identificacion',
    ];
    for (const campo of columnasDirectas) {
      if (campo in updateDto && updateDto[campo] !== undefined) {
        (updatePayload as any)[campo] = updateDto[campo];
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.pagosRepository.update({ id_pago: id }, updatePayload);
    }

    // Insertar auditoría (en paralelo, no bloquea la respuesta)
    if (registrosAuditoria.length > 0) {
      await this.auditoriaRepository.insert(registrosAuditoria);
    }

    // Devolver el registro actualizado
    const pagoActualizado = await this.findOne(id);
    const antes = { referencia: pago.referencia, monto: pago.monto, metodo_pago: pago.metodo_pago, tipo_documento: pago.tipo_documento, is_validated: pago.is_validated, is_rechazado: pago.is_rechazado };
    const despues = { referencia: pagoActualizado.referencia, monto: pagoActualizado.monto, metodo_pago: pagoActualizado.metodo_pago, tipo_documento: pagoActualizado.tipo_documento, is_validated: pagoActualizado.is_validated, is_rechazado: pagoActualizado.is_rechazado };
    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'pagos-realizados',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return pagoActualizado;
  }

  // ─── CAMBIAR ESTADO (validar / rechazar) ──────────────────────────────────

  async cambiarEstado(
    id: number,
    accion: 'validar' | 'rechazar' | 'resetear',
    motivoRechazo?: string,
    realizadoPor?: string,
  ): Promise<PagoRealizado> {
    const pago = await this.findOne(id);

    const updatePayload: Partial<PagoRealizado> = {};

    if (accion === 'validar') {
      updatePayload.is_validated = true;
      updatePayload.is_rechazado = false;
      updatePayload.motivo_rechazo = null;
    } else if (accion === 'rechazar') {
      updatePayload.is_validated = false;
      updatePayload.is_rechazado = true;
      updatePayload.motivo_rechazo = motivoRechazo ?? null;
    } else if (accion === 'resetear') {
      updatePayload.is_validated = false;
      updatePayload.is_rechazado = false;
      updatePayload.motivo_rechazo = null;
      updatePayload.reserva_id = null;
    }

    const accionAuditoria = accion === 'validar' ? 'VALIDACION' : accion === 'rechazar' ? 'RECHAZO' : 'RESETEO';
    const valorAnterior = pago.is_validated ? 'validado' : pago.is_rechazado ? 'rechazado' : 'pendiente';
    const valorNuevo = accion === 'validar' ? 'validado' : accion === 'rechazar' ? 'rechazado' : 'pendiente';

    await this.dataSource.transaction(async (manager) => {
      await manager.update(PagoRealizado, { id_pago: id }, updatePayload);

      await manager.insert(AuditoriaPago, {
        id_pago: id,
        accion: accionAuditoria,
        campo_modificado: 'estado',
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
        realizado_por: realizadoPor ?? null,
      });

      if (pago.reserva_id) {
        const reserva = await manager.findOne(Reserva, { where: { id: pago.reserva_id } });
        if (reserva && reserva.estado !== 'cancelado') {
          const pagosValidados = await manager.find(PagoRealizado, {
            where: { reserva_id: pago.reserva_id, is_validated: true },
            select: ['id_pago', 'monto', 'is_validated'],
          });
          // Recalcular con el nuevo estado del pago ya aplicado
          const totalPagado = pagosValidados
            .filter((p) => {
              if (accion === 'resetear' && p.id_pago === id) return false;
              return p.id_pago === id ? accion === 'validar' : p.is_validated;
            })
            .reduce((sum, p) => sum + Number(p.monto), 0);
          const nuevoEstado = Number(reserva.valor_total) > 0 && totalPagado >= Number(reserva.valor_total)
            ? 'al dia'
            : 'pendiente';
          if (reserva.estado !== nuevoEstado) {
            await manager.update(Reserva, { id: pago.reserva_id }, { estado: nuevoEstado });
          }
        }
      }
    });

    const pagoActualizado = await this.findOne(id);
    await this.auditoriaGeneralService.registrar({
      usuario_id: null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'pagos-realizados',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: {
        antes: { id_pago: id, referencia: pago.referencia, estado: valorAnterior },
        despues: { id_pago: id, referencia: pagoActualizado.referencia, estado: valorNuevo },
      },
    });

    return pagoActualizado;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: number, realizadoPor?: string, usuarioId?: number): Promise<{ message: string }> {
    const pago = await this.findOne(id);
    const reservaId = pago.reserva_id;

    // Auditoría de ELIMINACIÓN
    await this.auditoriaRepository.insert({
      id_pago: id,
      accion: 'ELIMINACION',
      realizado_por: realizadoPor ?? null,
    });

    await this.pagosRepository.remove(pago);

    if (reservaId) {
      await this.syncEstadoReserva(reservaId);
    }
    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: realizadoPor ?? null,
      modulo: 'pagos-realizados',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { referencia: pago.referencia, monto: pago.monto, reserva_id: reservaId },
    });

    return { message: `Pago con ID ${id} eliminado correctamente` };
  }

  // ─── SYNC ESTADO RESERVA ──────────────────────────────────────────────────

  private async syncEstadoReserva(reservaId: number): Promise<void> {
    const reserva = await this.reservaRepository.findOne({ where: { id: reservaId } });
    if (!reserva || reserva.estado === 'cancelado') return;

    const pagosValidados = await this.pagosRepository.find({
      where: { reserva_id: reservaId, is_validated: true },
      select: ['monto'],
    });
    const totalPagado = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);
    const valorTotal = Number(reserva.valor_total);

    const nuevoEstado = valorTotal > 0 && totalPagado >= valorTotal ? 'al dia' : 'pendiente';
    if (reserva.estado !== nuevoEstado) {
      await this.reservaRepository.update({ id: reservaId }, { estado: nuevoEstado });
    }
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
