import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RespuestaCotizacion } from './entities/respuesta-cotizacion.entity';
import { CotizacionRespuestaVista } from './entities/cotizacion-respuesta-vista.entity';
import { CreateRespuestaCotizacionDto, UpdateRespuestaCotizacionDto } from './dto/create-respuesta-cotizacion.dto';
import { Cotizacion } from './entities/cotizacion.entity';
import { Aerolinea } from '../aerolineas/entities/aerolinea.entity';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class RespuestasCotizacionService {
  // Preview en memoria — se limpia al reiniciar el servidor
  private readonly previewStore = new Map<string, object>();

  private calcPrecioTotal(vuelos: any[], opciones_hotel: any[], adicionales: any[]): number {
    const totalVuelos = vuelos.reduce((s, v) => s + (Number(v.costo) || 0), 0);
    const totalHoteles = opciones_hotel.reduce((s, h) => s + (Number(h.precio_total) || 0), 0);
    const totalAdicionales = adicionales.reduce((s, a) => s + (Number(a.precio) || 0), 0);
    return totalVuelos + totalHoteles + totalAdicionales;
  }

  private withPrecioTotal(r: RespuestaCotizacion) {
    return {
      ...r,
      precio_total: this.calcPrecioTotal(
        (r.vuelos as any[]) ?? [],
        (r.opciones_hotel as any[]) ?? [],
        (r.adicionales as any[]) ?? [],
      ),
    };
  }

  constructor(
    @InjectRepository(RespuestaCotizacion)
    private readonly respuestaRepo: Repository<RespuestaCotizacion>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepo: Repository<Cotizacion>,
    @InjectRepository(Aerolinea)
    private readonly aerolineaRepo: Repository<Aerolinea>,
    @InjectRepository(CotizacionRespuestaVista)
    private readonly vistaRepo: Repository<CotizacionRespuestaVista>,
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async registrarVista(respuestaId: number, ip: string | null, userAgent: string | null): Promise<void> {
    await this.vistaRepo.save(this.vistaRepo.create({ respuesta_id: respuestaId, ip, user_agent: userAgent }));
  }

  async getVistas(respuestaId: number) {
    const vistas = await this.vistaRepo.find({
      where: { respuesta_id: respuestaId },
      order: { created_at: 'DESC' },
    });
    return {
      total_vistas: vistas.length,
      primera_vista: vistas.length ? vistas[vistas.length - 1].created_at : null,
      ultima_vista:  vistas.length ? vistas[0].created_at : null,
      vistas,
    };
  }

  private async withVistas<T extends { id: number }>(rows: T[]): Promise<(T & { total_vistas: number; primera_vista: Date | null; ultima_vista: Date | null; vistas: CotizacionRespuestaVista[] })[]> {
    if (!rows.length) return rows.map(r => ({ ...r, total_vistas: 0, primera_vista: null, ultima_vista: null, vistas: [] }));
    const ids = rows.map(r => r.id);
    const vistas = await this.vistaRepo.find({ where: { respuesta_id: In(ids) }, order: { created_at: 'ASC' } });
    const map = new Map<number, CotizacionRespuestaVista[]>();
    for (const v of vistas) {
      if (!map.has(v.respuesta_id)) map.set(v.respuesta_id, []);
      map.get(v.respuesta_id)!.push(v);
    }
    return rows.map(r => {
      const rv = map.get(r.id) ?? [];
      return {
        ...r,
        total_vistas:  rv.length,
        primera_vista: rv.length ? rv[0].created_at : null,
        ultima_vista:  rv.length ? rv[rv.length - 1].created_at : null,
        vistas:        rv.slice().reverse(), // más reciente primero
      };
    });
  }

  async create(dto: CreateRespuestaCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const token = randomUUID();
    const baseUrl = this.configService.get<string>('FRONTEND_URL') ?? `http://localhost:${this.configService.get('PORT') ?? 3001}`;
    const link = `${baseUrl}/cotizacion/${token}`;

    const respuesta = this.respuestaRepo.create({
      token,
      link,
      cotizacion_id: dto.cotizacion_id ?? null,
      nombre_cliente: dto.nombre_cliente,
      telefono_cliente: dto.telefono_cliente,
      titulo_viaje: dto.titulo_viaje,
      imagenes_destino: dto.imagenes_destino ?? [],
      items_incluidos: dto.items_incluidos ?? [],
      items_no_incluidos: dto.items_no_incluidos ?? [],
      vuelos: dto.vuelos,
      opciones_hotel: dto.opciones_hotel,
      adicionales: dto.adicionales ?? [],
      condiciones_generales: dto.condiciones_generales ?? null,
      es_publica: dto.es_publica ?? false,
      creado_por_id: usuarioId ?? null,
      creado_por_nombre: usuarioNombre ?? null,
    });
    const saved = await this.respuestaRepo.save(respuesta);

    // Si viene con cotizacion_id, actualizar la cotización con la referencia
    if (dto.cotizacion_id) {
      await this.cotizacionRepo.update(dto.cotizacion_id, {
        respuesta_cotizacion_id: saved.id,
      });
    }

    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'respuestas-cotizacion',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { titulo_viaje: saved.titulo_viaje, link: saved.link, cotizacion_id: saved.cotizacion_id },
    });

    return this.withPrecioTotal(saved);
  }

  async findAll(isSinCotizacion?: boolean, usuarioId?: number, page = 1, limit = 20, rol?: string) {
    const qb = this.respuestaRepo.createQueryBuilder('respuesta')
      .where('respuesta.es_publica = false')
      .orderBy('respuesta.anclada', 'DESC')
      .addOrderBy('respuesta.created_at', 'DESC');

    if (isSinCotizacion) {
      qb.andWhere('respuesta.cotizacion_id IS NULL');
    }

    if (usuarioId && rol !== 'admin') {
      qb.andWhere('respuesta.creado_por_id = :usuarioId', { usuarioId });
    }

    const offset = (page - 1) * limit;
    const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const enriched = await this.withVistas(rows.map(r => this.withPrecioTotal(r)));

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPlantillas(usuarioId?: number, page = 1, limit = 20, rol?: string) {
    const qb = this.respuestaRepo.createQueryBuilder('respuesta')
      .where('respuesta.es_publica = true')
      .orderBy('respuesta.anclada', 'DESC')
      .addOrderBy('respuesta.created_at', 'DESC');

    if (usuarioId && rol !== 'admin') {
      qb.andWhere('respuesta.creado_por_id = :usuarioId', { usuarioId });
    }

    const offset = (page - 1) * limit;
    const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return {
      data: rows.map((r) => this.withPrecioTotal(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }
    const [enriched] = await this.withVistas([this.withPrecioTotal(respuesta)]);
    return enriched;
  }

  async findByCotizacion(cotizacionId: number) {
    const rows = await this.respuestaRepo.find({
      where: { cotizacion_id: cotizacionId },
      order: { created_at: 'DESC' },
    });
    return this.withVistas(rows.map((r) => this.withPrecioTotal(r)));
  }

  async update(id: number, dto: UpdateRespuestaCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }

    const fields: Partial<RespuestaCotizacion> = {};
    if (dto.anclada !== undefined)             fields.anclada             = dto.anclada;
    if (dto.es_publica !== undefined)          fields.es_publica          = dto.es_publica;
    if (dto.nombre_cliente !== undefined)      fields.nombre_cliente      = dto.nombre_cliente;
    if (dto.telefono_cliente !== undefined)    fields.telefono_cliente    = dto.telefono_cliente;
    if (dto.titulo_viaje !== undefined)        fields.titulo_viaje        = dto.titulo_viaje;
    if (dto.imagenes_destino !== undefined)    fields.imagenes_destino    = dto.imagenes_destino;
    if (dto.items_incluidos !== undefined)     fields.items_incluidos     = dto.items_incluidos;
    if (dto.items_no_incluidos !== undefined)  fields.items_no_incluidos  = dto.items_no_incluidos;
    if (dto.vuelos !== undefined)              fields.vuelos              = dto.vuelos;
    if (dto.opciones_hotel !== undefined)      fields.opciones_hotel      = dto.opciones_hotel;
    if (dto.adicionales !== undefined)         fields.adicionales         = dto.adicionales;
    if (dto.condiciones_generales !== undefined) fields.condiciones_generales = dto.condiciones_generales;

    await this.respuestaRepo.update(id, fields);

    const updated = await this.respuestaRepo.findOne({ where: { id } });

    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'respuestas-cotizacion',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { campos_actualizados: Object.keys(fields), titulo_viaje: updated!.titulo_viaje },
    });

    return this.withPrecioTotal(updated!);
  }

  async toggleAnclada(id: number, usuarioId?: number, usuarioNombre?: string) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }
    const nuevoEstado = !respuesta.anclada;
    await this.respuestaRepo.update(id, { anclada: nuevoEstado });
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'respuestas-cotizacion',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { anclada: nuevoEstado, titulo_viaje: respuesta.titulo_viaje },
    });
    return { id, anclada: nuevoEstado };
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }
    await this.respuestaRepo.delete(id);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'respuestas-cotizacion',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { titulo_viaje: respuesta.titulo_viaje, token: respuesta.token },
    });
    return { ok: true };
  }

  createPreview(dto: CreateRespuestaCotizacionDto) {
    const token = `prev_${randomUUID()}`;
    const baseUrl = this.configService.get<string>('FRONTEND_URL') ?? `http://localhost:${this.configService.get('PORT') ?? 3001}`;
    const link = `${baseUrl}/cotizacion/${token}`;

    // Construir el mismo shape que devuelve findByToken
    const data = {
      id: null,
      cotizacion_id: dto.cotizacion_id ?? null,
      token,
      link,
      titulo_viaje: dto.titulo_viaje,
      imagenes_destino: dto.imagenes_destino ?? [],
      items_incluidos: dto.items_incluidos ?? [],
      items_no_incluidos: dto.items_no_incluidos ?? [],
      vuelos: dto.vuelos ?? [],
      opciones_hotel: dto.opciones_hotel ?? [],
      adicionales: dto.adicionales ?? [],
      condiciones_generales: dto.condiciones_generales ?? null,
      precio_total: this.calcPrecioTotal(dto.vuelos ?? [], dto.opciones_hotel ?? [], dto.adicionales ?? []),
      created_at: new Date().toISOString(),
      _preview: true,
    };

    this.previewStore.set(token, data);

    // Auto-expirar en 2 horas
    setTimeout(() => this.previewStore.delete(token), 2 * 60 * 60 * 1000);

    return { token, link, _preview: true };
  }

  async findByToken(token: string) {
    // Primero revisar el store de preview (en memoria)
    if (token.startsWith('prev_')) {
      const preview = this.previewStore.get(token);
      if (!preview) throw new NotFoundException('Preview expirado o no encontrado');
      return preview;
    }

    const respuesta = await this.respuestaRepo.findOne({ where: { token } });
    if (!respuesta) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const vuelos = respuesta.vuelos as any[];
    const aerolineaIds = [...new Set(vuelos.map((v) => v.aerolinea_id).filter(Boolean))] as number[];

    let aerolineaMap = new Map<number, Partial<Aerolinea>>();
    if (aerolineaIds.length > 0) {
      const aerolineas = await this.aerolineaRepo.find({ where: { id: In(aerolineaIds) } });
      aerolineaMap = new Map(
        aerolineas.map((a) => [a.id, { nombre: a.nombre, codigo_iata: a.codigo_iata, logo_url: a.logo_url }]),
      );
    }

    const vuelosEnriquecidos = vuelos.map((v) => ({ ...v, aerolinea: aerolineaMap.get(v.aerolinea_id) ?? null }));

    return this.withPrecioTotal({ ...respuesta, vuelos: vuelosEnriquecidos } as RespuestaCotizacion);
  }
}
