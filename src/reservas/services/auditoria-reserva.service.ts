import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaReserva } from '../entities/auditoria-reserva.entity';
import { Reserva } from '../entities/reserva.entity';

@Injectable()
export class AuditoriaReservaService {
  constructor(
    @InjectRepository(AuditoriaReserva)
    private readonly auditoriaRepository: Repository<AuditoriaReserva>,
  ) {}

  async registrarCreacion(
    reserva: Reserva,
    realizadoPor?: string,
  ): Promise<AuditoriaReserva> {
    const auditoria = this.auditoriaRepository.create({
      reserva,
      accion: 'CREACION',
      descripcion: `Reserva creada con email: ${reserva.correo}`,
      realizado_por: realizadoPor,
    });
    return this.auditoriaRepository.save(auditoria);
  }

  async registrarCambioEstado(
    reserva: Reserva,
    estadoAnterior: string,
    estadoNuevo: string,
    realizadoPor?: string,
  ): Promise<AuditoriaReserva> {
    const auditoria = this.auditoriaRepository.create({
      reserva,
      accion: 'CAMBIO_ESTADO',
      campo_modificado: 'estado',
      valor_anterior: estadoAnterior,
      valor_nuevo: estadoNuevo,
      descripcion: `Estado cambió de ${estadoAnterior} a ${estadoNuevo}`,
      realizado_por: realizadoPor,
    });
    return this.auditoriaRepository.save(auditoria);
  }

  async registrarEdicion(
    reserva: Reserva,
    campoModificado: string,
    valorAnterior: any,
    valorNuevo: any,
    realizadoPor?: string,
    descripcion?: string,
  ): Promise<AuditoriaReserva> {
    const auditoria = this.auditoriaRepository.create({
      reserva,
      accion: 'EDICION',
      campo_modificado: campoModificado,
      valor_anterior: String(valorAnterior),
      valor_nuevo: String(valorNuevo),
      descripcion: descripcion || `${campoModificado} fue actualizado`,
      realizado_por: realizadoPor,
    });
    return this.auditoriaRepository.save(auditoria);
  }

  async obtenerAuditoria(idReserva: number): Promise<AuditoriaReserva[]> {
    return this.auditoriaRepository.find({
      where: { reserva: { id: idReserva } },
      order: { fecha_auditoria: 'DESC' },
    });
  }
}
