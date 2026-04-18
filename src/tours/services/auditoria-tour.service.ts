import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaTour } from '../entities/auditoria-tour.entity';
import { ToursMaestro } from '../entities/tours-maestro.entity';

@Injectable()
export class AuditoriaTourService {
  constructor(
    @InjectRepository(AuditoriaTour)
    private readonly auditoriaRepository: Repository<AuditoriaTour>,
  ) {}

  async registrarCreacion(tour: ToursMaestro, realizadoPor?: string): Promise<void> {
    await this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        tour,
        accion: 'CREACION',
        descripcion: `Tour "${tour.nombre_tour}" creado con precio $${tour.precio}`,
        realizado_por: realizadoPor ?? null,
      }),
    );
  }

  async registrarEdicion(
    tour: ToursMaestro,
    campo: string,
    valorAnterior: any,
    valorNuevo: any,
    realizadoPor?: string,
  ): Promise<void> {
    await this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        tour,
        accion: 'EDICION',
        campo_modificado: campo,
        valor_anterior: valorAnterior != null ? String(valorAnterior) : null,
        valor_nuevo: valorNuevo != null ? String(valorNuevo) : null,
        descripcion: `Campo "${campo}" actualizado`,
        realizado_por: realizadoPor ?? null,
      }),
    );
  }

  async registrarCambioEstado(
    tour: ToursMaestro,
    campo: 'is_active' | 'es_borrador',
    valorAnterior: boolean,
    valorNuevo: boolean,
    realizadoPor?: string,
  ): Promise<void> {
    const label = campo === 'is_active' ? 'estado activo' : 'borrador';
    await this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        tour,
        accion: 'CAMBIO_ESTADO',
        campo_modificado: campo,
        valor_anterior: String(valorAnterior),
        valor_nuevo: String(valorNuevo),
        descripcion: `Tour "${tour.nombre_tour}" cambió ${label} de ${valorAnterior} a ${valorNuevo}`,
        realizado_por: realizadoPor ?? null,
      }),
    );
  }

  async registrarEliminacion(tour: ToursMaestro, realizadoPor?: string): Promise<void> {
    await this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        tour,
        accion: 'ELIMINACION',
        descripcion: `Tour "${tour.nombre_tour}" (id=${tour.id}) marcado como eliminado`,
        realizado_por: realizadoPor ?? null,
      }),
    );
  }

  async obtenerAuditoria(tourId: number): Promise<AuditoriaTour[]> {
    return this.auditoriaRepository.find({
      where: { tour: { id: tourId } },
      order: { fecha_auditoria: 'DESC' },
    });
  }
}
