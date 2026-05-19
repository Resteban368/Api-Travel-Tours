import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  private async withAsesor<T extends { asesor_id: number | null }>(rows: T[]): Promise<(T & { asesor_nombre: string })[]> {
    const ids = [...new Set(rows.map((r) => r.asesor_id).filter((id): id is number => id !== null))];
    const usuarios = ids.length
      ? await this.usuarioRepository.findBy({ id_usuario: In(ids) })
      : [];
    const map = new Map(usuarios.map((u) => [u.id_usuario, u.nombre]));
    return rows.map((r) => ({
      ...r,
      asesor_nombre: r.asesor_id ? (map.get(r.asesor_id) ?? 'Agente IA') : 'Agente IA',
    }));
  }

  async create(createCotizacionDto: CreateCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const newCotizacion = this.cotizacionRepository.create(createCotizacionDto);
    const saved = await this.cotizacionRepository.save(newCotizacion);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'cotizaciones',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { id: saved.id, nombre_completo: saved.nombre_completo, numero_pasajeros: saved.numero_pasajeros },
    });
    return saved;
  }

  async findAll(page = 1, limit = 20, estado?: string, estadoNot?: string) {
    let whereClause: any = {};
    if (estado) {
      whereClause.estado = estado;
    } else if (estadoNot) {
      // Import Not dynamically or use a simple query builder to avoid import issues
    }

    const qb = this.cotizacionRepository.createQueryBuilder('cotizacion')
      .orderBy('cotizacion.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado) {
      qb.andWhere('cotizacion.estado = :estado', { estado });
    } else if (estadoNot) {
      qb.andWhere('cotizacion.estado != :estadoNot', { estadoNot });
    }

    const [data, total] = await qb.getManyAndCount();
    const enriched = await this.withAsesor(data);
    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const cotizacion = await this.cotizacionRepository.findOne({ where: { id } });
    if (!cotizacion) {
      throw new NotFoundException(`Cotización con id ${id} no encontrada`);
    }
    const [enriched] = await this.withAsesor([cotizacion]);
    return enriched;
  }

  async update(id: number, updateCotizacionDto: UpdateCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const cotizacion = await this.findOne(id);
    const antes = { nombre_completo: cotizacion.nombre_completo, numero_pasajeros: cotizacion.numero_pasajeros, origen: cotizacion.origen, destino: cotizacion.destino, fecha_salida: cotizacion.fecha_salida, fecha_regreso: cotizacion.fecha_regreso };
    const updatedCotizacion = this.cotizacionRepository.merge(cotizacion, updateCotizacionDto);
    const saved = await this.cotizacionRepository.save(updatedCotizacion);
    const despues = { nombre_completo: saved.nombre_completo, numero_pasajeros: saved.numero_pasajeros, origen: saved.origen, destino: saved.destino, fecha_salida: saved.fecha_salida, fecha_regreso: saved.fecha_regreso };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'cotizaciones',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string) {
    const cotizacion = await this.findOne(id);
    const result = await this.cotizacionRepository.remove(cotizacion);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'cotizaciones',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre_completo: cotizacion.nombre_completo },
    });
    return result;
  }
}
