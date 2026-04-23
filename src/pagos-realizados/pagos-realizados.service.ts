import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, DataSource } from 'typeorm';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

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
  'is_rechazado',
  'motivo_rechazo',
  'url_imagen',
  'reserva_id',
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
    const existing = await this.pagosRepository.findOne({
      where: { referencia: createDto.referencia },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un pago con la referencia ${createDto.referencia}`,
      );
    }

    // Separar la FK de reserva_id para evitar conflicto con el objeto de relación en TypeORM
    const { reserva_id, ...rest } = createDto;
    const pago = this.pagosRepository.create(rest);
    if (reserva_id !== undefined) {
      pago.reserva_id = reserva_id ?? null;
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
      detalle: { referencia: pagoCreado.referencia, monto: pagoCreado.monto, metodo_pago: pagoCreado.metodo_pago, reserva_id: pagoCreado.reserva_id },
    });

    return pagoCreado;
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(startDate?: string, endDate?: string, page = 1, limit = 20) {
    const where: any = {};

    if (startDate && endDate) {
      where.fecha_creacion = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.fecha_creacion = Between(new Date(startDate), new Date());
    }

    const [data, total] = await this.pagosRepository.findAndCount({
      where,
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

    // Construir objeto de actualización sólo con los campos presentes en el DTO
    // Se usa repository.update() (SQL directo) para evitar que TypeORM sobreescriba
    // la FK reserva_id a null al hacer save() con la relación no cargada.
    const updatePayload: Partial<PagoRealizado> = {};
    const columnasDirectas: (keyof UpdatePagoRealizadoDto)[] = [
      'chat_id', 'tipo_documento', 'monto', 'proveedor_comercio',
      'nit', 'metodo_pago', 'referencia', 'fecha_documento',
      'is_validated', 'is_rechazado', 'motivo_rechazo', 'url_imagen', 'reserva_id',
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
    accion: 'validar' | 'rechazar',
    motivoRechazo?: string,
    realizadoPor?: string,
  ): Promise<PagoRealizado> {
    const pago = await this.findOne(id);

    const updatePayload: Partial<PagoRealizado> = {};

    if (accion === 'validar') {
      updatePayload.is_validated = true;
      updatePayload.is_rechazado = false;
      updatePayload.motivo_rechazo = null;
    } else {
      updatePayload.is_validated = false;
      updatePayload.is_rechazado = true;
      updatePayload.motivo_rechazo = motivoRechazo ?? null;
    }

    const accionAuditoria = accion === 'validar' ? 'VALIDACION' : 'RECHAZO';
    const valorAnterior = pago.is_validated ? 'validado' : pago.is_rechazado ? 'rechazado' : 'pendiente';
    const valorNuevo = accion === 'validar' ? 'validado' : 'rechazado';

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
            .filter((p) => (p.id_pago === id ? accion === 'validar' : p.is_validated))
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
