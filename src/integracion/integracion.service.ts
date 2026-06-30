import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Faq } from '../faqs/entities/faq.entity';

const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── Shapes públicos (solo campos seguros) ────────────────────────────────────

export interface TourPublico {
  id: number;
  id_tour: number | null;
  nombre_tour: string;
  tipo_tour: string | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  precio: number | null;
  precio_por_pareja: boolean;
  modo_precio: string;
  punto_partida: string | null;
  hora_partida: string | null;
  llegada: string | null;
  url_imagen: string | null;
  imagenes: string[] | null;
  link_pdf: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  itinerary: any[] | null;
  cupos: number | null;
  es_promocion: boolean;
  sede_id: string | null;
  precios: Array<{
    id: number;
    descripcion: string;
    precio: number;
    edad_min: number | null;
    edad_max: number | null;
    punto_partida: string | null;
    activo: boolean;
  }>;
  precios_grupales: Array<{
    id: number;
    min_personas: number;
    max_personas: number;
    precio: number;
    descripcion: string | null;
    activo: boolean;
  }>;
}

export interface ServicioPublico {
  id_servicio: number;
  nombre_servicio: string;
  descripcion: string | null;
  costo: number | null;
  imagenes: string[] | null;
}

export interface FaqPublica {
  id_faq: number;
  pregunta: string;
  respuesta: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class IntegracionService {
  constructor(
    @InjectRepository(ToursMaestro)
    private readonly toursRepo: Repository<ToursMaestro>,
    @InjectRepository(Servicio)
    private readonly serviciosRepo: Repository<Servicio>,
    @InjectRepository(Faq)
    private readonly faqsRepo: Repository<Faq>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ── Tours ──────────────────────────────────────────────────────────────────

  async findTours(): Promise<TourPublico[]> {
    const cacheKey = 'integracion:tours';
    const cached = await this.cache.get<TourPublico[]>(cacheKey);
    if (cached) return cached;

    const tours = await this.toursRepo.find({
      where: {
        is_active: true,
        es_borrador: false,
        es_finalizado: false,
        deleted_at: IsNull(),
      },
      order: { fecha_inicio: 'ASC' },
    });

    const result = tours.map((t) => this.mapTour(t));
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findTour(id: number): Promise<TourPublico> {
    const tour = await this.toursRepo.findOne({
      where: {
        id,
        is_active: true,
        es_borrador: false,
        es_finalizado: false,
        deleted_at: IsNull(),
      },
    });

    if (!tour) throw new NotFoundException(`Tour con ID ${id} no encontrado o no está disponible`);
    return this.mapTour(tour);
  }

  // ── Servicios ──────────────────────────────────────────────────────────────

  async findServicios(): Promise<ServicioPublico[]> {
    const cacheKey = 'integracion:servicios';
    const cached = await this.cache.get<ServicioPublico[]>(cacheKey);
    if (cached) return cached;

    const servicios = await this.serviciosRepo.find({
      where: { activo: true },
      order: { id_servicio: 'ASC' },
    });

    const result = servicios.map((s) => this.mapServicio(s));
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ── FAQs ───────────────────────────────────────────────────────────────────

  async findFaqs(): Promise<FaqPublica[]> {
    const cacheKey = 'integracion:faqs';
    const cached = await this.cache.get<FaqPublica[]>(cacheKey);
    if (cached) return cached;

    const faqs = await this.faqsRepo.find({
      where: { activo: true },
      order: { id_faq: 'ASC' },
    });

    const result = faqs.map((f) => this.mapFaq(f));
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ── Mappers (proyección explícita de campos seguros) ───────────────────────

  private mapTour(t: ToursMaestro): TourPublico {
    return {
      id: t.id,
      id_tour: t.id_tour,
      nombre_tour: t.nombre_tour,
      tipo_tour: t.tipo_tour,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin,
      precio: t.precio,
      precio_por_pareja: t.precio_por_pareja,
      modo_precio: t.modo_precio,
      punto_partida: t.punto_partida,
      hora_partida: t.hora_partida,
      llegada: t.llegada,
      url_imagen: t.url_imagen,
      imagenes: t.imagenes,
      link_pdf: t.link_pdf,
      inclusions: t.inclusions,
      exclusions: t.exclusions,
      itinerary: t.itinerary,
      cupos: t.cupos,
      es_promocion: t.es_promocion,
      sede_id: t.sede_id,
      precios: (t.precios ?? [])
        .filter((p) => p.activo)
        .map((p) => ({
          id: p.id,
          descripcion: p.descripcion,
          precio: p.precio,
          edad_min: p.edad_min,
          edad_max: p.edad_max,
          punto_partida: p.punto_partida,
          activo: p.activo,
        })),
      precios_grupales: (t.precios_grupales ?? [])
        .filter((pg) => pg.activo)
        .map((pg) => ({
          id: pg.id,
          min_personas: pg.min_personas,
          max_personas: pg.max_personas,
          precio: pg.precio,
          descripcion: pg.descripcion,
          activo: pg.activo,
        })),
    };
  }

  private mapServicio(s: Servicio): ServicioPublico {
    return {
      id_servicio: s.id_servicio,
      nombre_servicio: s.nombre_servicio,
      descripcion: s.descripcion,
      costo: s.costo,
      imagenes: s.imagenes,
    };
  }

  private mapFaq(f: Faq): FaqPublica {
    return {
      id_faq: f.id_faq,
      pregunta: f.pregunta,
      respuesta: f.respuesta,
    };
  }
}
