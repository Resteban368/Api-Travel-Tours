import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RespuestaCotizacion } from './entities/respuesta-cotizacion.entity';
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
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateRespuestaCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const token = randomUUID();
    const baseUrl = this.configService.get<string>('FRONTEND_URL') ?? `http://localhost:${this.configService.get('PORT') ?? 3001}`;
    const link = `${baseUrl}/cotizacion/${token}`;

    const respuesta = this.respuestaRepo.create({
      token,
      link,
      cotizacion_id: dto.cotizacion_id ?? null,
      titulo_viaje: dto.titulo_viaje,
      imagenes_destino: dto.imagenes_destino ?? [],
      items_incluidos: dto.items_incluidos ?? [],
      items_no_incluidos: dto.items_no_incluidos ?? [],
      vuelos: dto.vuelos,
      opciones_hotel: dto.opciones_hotel,
      adicionales: dto.adicionales ?? [],
      condiciones_generales: dto.condiciones_generales ?? null,
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

  async findAll(isSinCotizacion?: boolean) {
    const where: any = {};
    if (isSinCotizacion) {
      import('typeorm').then(typeorm => {
        // Can't use IsNull directly easily without importing. I will use queryBuilder.
      });
    }

    const qb = this.respuestaRepo.createQueryBuilder('respuesta')
      .orderBy('respuesta.created_at', 'DESC');

    if (isSinCotizacion) {
      qb.andWhere('respuesta.cotizacion_id IS NULL');
    }

    const rows = await qb.getMany();
    return rows.map((r) => this.withPrecioTotal(r));
  }

  async findOne(id: number) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }
    return this.withPrecioTotal(respuesta);
  }

  async findByCotizacion(cotizacionId: number) {
    const rows = await this.respuestaRepo.find({
      where: { cotizacion_id: cotizacionId },
      order: { created_at: 'DESC' },
    });
    return rows.map((r) => this.withPrecioTotal(r));
  }

  async update(id: number, dto: UpdateRespuestaCotizacionDto, usuarioId?: number, usuarioNombre?: string) {
    const respuesta = await this.respuestaRepo.findOne({ where: { id } });
    if (!respuesta) {
      throw new NotFoundException(`Respuesta de cotización con id ${id} no encontrada`);
    }

    const fields: Partial<RespuestaCotizacion> = {};
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
