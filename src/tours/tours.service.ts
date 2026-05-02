import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { toSql } from 'pgvector/utils';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { TourPrecio } from './entities/tour-precio.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { AuditoriaTour } from './entities/auditoria-tour.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AuditoriaTourService } from './services/auditoria-tour.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

const CACHE_KEY_ACTIVOS = 'tours:activos';
const CACHE_KEY_TODOS = 'tours:todos';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(ToursMaestro)
    private readonly toursMaestroRepository: Repository<ToursMaestro>,
    @InjectRepository(TourPrecio)
    private readonly tourPrecioRepository: Repository<TourPrecio>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorsRepository: Repository<N8nVector>,
    @InjectRepository(AuditoriaTour)
    private readonly auditoriaTourRepository: Repository<AuditoriaTour>,
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepository: Repository<PagoRealizado>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly auditoriaTourService: AuditoriaTourService,
    private readonly auditoriaGeneralService: AuditoriaGeneralService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(dto: CreateTourDto, usuarioId?: number, usuarioNombre?: string): Promise<ToursMaestro> {
    const tour = this.toursMaestroRepository.create({
      id_tour: dto.id_tour ?? null,
      nombre_tour: dto.nombre_tour,
      agencia: dto.agencia ?? null,
      fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : null,
      fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
      precio: dto.precio ?? null,
      precio_por_pareja: dto.precio_por_pareja ?? false,
      punto_partida: dto.punto_partida ?? null,
      hora_partida: dto.hora_partida ?? null,
      llegada: dto.llegada ?? null,
      url_imagen: dto.url_imagen ?? null,
      link_pdf: dto.link_pdf ?? null,
      inclusions: dto.inclusions ?? null,
      exclusions: dto.exclusions ?? null,
      itinerary: dto.itinerary ?? null,
      cupos: dto.cupos ?? null,
      es_promocion: dto.es_promocion ?? false,
      is_active: dto.is_active ?? true,
      es_borrador: dto.es_borrador ?? false,
      sede_id: dto.sede_id ?? null,
    });
    const saved = await this.toursMaestroRepository.save(tour);

    // Guardar precios si se enviaron
    let savedPrecios: TourPrecio[] = [];
    if (dto.precios && dto.precios.length > 0) {
      const preciosEntidades = dto.precios.map((p) =>
        this.tourPrecioRepository.create({
          tour: saved,
          descripcion: p.descripcion,
          edad_min: p.edad_min ?? null,
          edad_max: p.edad_max ?? null,
          punto_partida: p.punto_partida ?? null,
          precio: p.precio,
          activo: p.activo ?? true,
        }),
      );
      savedPrecios = await this.tourPrecioRepository.save(preciosEntidades);
    }

    await this.auditoriaTourService.registrarCreacion(saved).catch(() => null);
    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'tours',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: {
        nombre_tour: saved.nombre_tour,
        agencia: saved.agencia,
        precio: saved.precio,
        precios: savedPrecios.length,
        cupos: saved.cupos,
        es_borrador: saved.es_borrador,
      },
    });

    if (!saved.is_active || saved.es_borrador) {
      return saved;
    }

    const chunksPayload = this.generateSemanticChunks({
      nombre_tour: dto.nombre_tour,
      agencia: dto.agencia,
      precio: dto.precio,
      precios: savedPrecios,
      punto_partida: dto.punto_partida,
      llegada: dto.llegada,
      inclusions: dto.inclusions,
      exclusions: dto.exclusions,
      itinerary: dto.itinerary,
    });

    const metadataBase: Record<string, any> = {
      id_tour: saved.id_tour,
      id: saved.id,
      es_promocion: saved.es_promocion,
      tipo: saved.es_promocion ? 'promocion' : 'tour',
      fecha_creacion: saved.createdAt
        ? saved.createdAt.toISOString()
        : new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
    };

    // Generar todos los embeddings en paralelo y guardarlos
    const vectorRows = await Promise.all(
      chunksPayload.map(async (chunk) => {
        const embedding = await this.embeddingsService.embed(chunk.text);
        const chunkMetadata = {
          ...metadataBase,
          chunk_type: chunk.chunk_type,
          ...(chunk.chunk_index !== undefined ? { chunk_index: chunk.chunk_index } : {}),
        };
        return this.n8nVectorsRepository.create({
          text: chunk.text || null,
          metadata: chunkMetadata,
          embedding,
          fileId: null,
          modifiedTime: new Date(),
        });
      }),
    );
    await this.n8nVectorsRepository.save(vectorRows);
    await Promise.all([
      this.cacheManager.del(CACHE_KEY_ACTIVOS),
      this.cacheManager.del(CACHE_KEY_TODOS),
    ]);

    return saved;
  }

  async update(id: number, dto: UpdateTourDto, usuarioId?: number, usuarioNombre?: string): Promise<ToursMaestro> {
    const tour = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour con id ${id} no encontrado`);
    }

    const antes = {
      nombre_tour: tour.nombre_tour,
      agencia: tour.agencia,
      precio: tour.precio,
      cupos: tour.cupos,
      is_active: tour.is_active,
      es_borrador: tour.es_borrador,
      fecha_inicio: tour.fecha_inicio,
      fecha_fin: tour.fecha_fin,
    };

    // Campos auditables con sus valores anteriores
    const camposAuditables: { campo: string; anterior: any; nuevo: any }[] = [];
    const track = (campo: string, anterior: any, nuevo: any) => {
      if (nuevo !== undefined && String(anterior ?? '') !== String(nuevo ?? ''))
        camposAuditables.push({ campo, anterior, nuevo });
    };

    if (dto.id_tour !== undefined) tour.id_tour = dto.id_tour;
    track('nombre_tour', tour.nombre_tour, dto.nombre_tour);
    if (dto.nombre_tour !== undefined) tour.nombre_tour = dto.nombre_tour;
    if (dto.agencia !== undefined) tour.agencia = dto.agencia;
    if (dto.fecha_inicio !== undefined)
      tour.fecha_inicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : null;
    if (dto.fecha_fin !== undefined)
      tour.fecha_fin = dto.fecha_fin ? new Date(dto.fecha_fin) : null;
    track('precio', tour.precio, dto.precio);
    if (dto.precio !== undefined) tour.precio = dto.precio;
    if (dto.precio_por_pareja !== undefined) tour.precio_por_pareja = dto.precio_por_pareja ?? null;
    if (dto.punto_partida !== undefined) tour.punto_partida = dto.punto_partida;
    if (dto.hora_partida !== undefined) tour.hora_partida = dto.hora_partida;
    if (dto.llegada !== undefined) tour.llegada = dto.llegada;
    if (dto.url_imagen !== undefined) tour.url_imagen = dto.url_imagen;
    if (dto.link_pdf !== undefined) tour.link_pdf = dto.link_pdf;
    if (dto.inclusions !== undefined) tour.inclusions = dto.inclusions;
    if (dto.exclusions !== undefined) tour.exclusions = dto.exclusions;
    if (dto.itinerary !== undefined) tour.itinerary = dto.itinerary;
    if (dto.es_promocion !== undefined) tour.es_promocion = dto.es_promocion;
    if (dto.is_active !== undefined) {
      track('is_active', tour.is_active, dto.is_active);
      tour.is_active = dto.is_active;
      tour.deleted_at = dto.is_active ? null : new Date();
    }
    track('cupos', tour.cupos, dto.cupos);
    if (dto.cupos !== undefined) tour.cupos = dto.cupos ?? null;
    track('es_borrador', tour.es_borrador, dto.es_borrador);
    if (dto.es_borrador !== undefined) tour.es_borrador = dto.es_borrador;
    if (dto.sede_id !== undefined) tour.sede_id = dto.sede_id ?? null;

    const saved = await this.toursMaestroRepository.save(tour);

    // Reemplazar precios si se enviaron en el DTO
    if (dto.precios !== undefined) {
      await this.tourPrecioRepository.delete({ tour: { id: saved.id } });
      if (dto.precios.length > 0) {
        const preciosEntidades = dto.precios.map((p) =>
          this.tourPrecioRepository.create({
            tour: saved,
            descripcion: p.descripcion,
            edad_min: p.edad_min ?? null,
            edad_max: p.edad_max ?? null,
            punto_partida: p.punto_partida ?? null,
            precio: p.precio,
            activo: p.activo ?? true,
          }),
        );
        await this.tourPrecioRepository.save(preciosEntidades);
      }
    }

    // Cargar precios actuales para los chunks (incluyendo los recién guardados)
    const preciosActuales = await this.tourPrecioRepository.find({
      where: { tour: { id: saved.id } },
    });

    const despues = {
      nombre_tour: saved.nombre_tour,
      agencia: saved.agencia,
      precio: saved.precio,
      precios: preciosActuales.length,
      cupos: saved.cupos,
      is_active: saved.is_active,
      es_borrador: saved.es_borrador,
      fecha_inicio: saved.fecha_inicio,
      fecha_fin: saved.fecha_fin,
    };

    await this.auditoriaGeneralService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'tours',
      operacion: 'ACTUALIZAR',
      documento_id: saved.id,
      detalle: { antes, despues },
    });

    // Registrar auditoría por cada campo que cambió
    await Promise.all(
      camposAuditables.map(({ campo, anterior, nuevo }) => {
        if (campo === 'is_active' || campo === 'es_borrador') {
          return this.auditoriaTourService
            .registrarCambioEstado(saved, campo as any, anterior, nuevo)
            .catch(() => null);
        }
        return this.auditoriaTourService
          .registrarEdicion(saved, campo, anterior, nuevo)
          .catch(() => null);
      }),
    );

    // Buscar vectores existentes de este tour
    const existingVectors = await this.n8nVectorsRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'id' = :id", { id: String(id) })
      .getMany();

    // Si el tour se desactiva o pasa a borrador, eliminar sus vectores y no regenerar
    if (!saved.is_active || saved.es_borrador) {
      if (existingVectors.length > 0) {
        await this.n8nVectorsRepository.remove(existingVectors);
      }
      await Promise.all([
        this.cacheManager.del(CACHE_KEY_ACTIVOS),
        this.cacheManager.del(CACHE_KEY_TODOS),
      ]);
      return saved;
    }

    const chunksPayload = this.generateSemanticChunks({
      nombre_tour: saved.nombre_tour,
      agencia: saved.agencia,
      precio: saved.precio,
      precios: preciosActuales,
      punto_partida: saved.punto_partida,
      llegada: saved.llegada,
      inclusions: saved.inclusions,
      exclusions: saved.exclusions,
      itinerary: saved.itinerary,
    });

    const fetchCreationDate = existingVectors.find(
      (v) => v.metadata?.fecha_creacion,
    )?.metadata?.fecha_creacion;

    const metadataBase: Record<string, any> = {
      id_tour: saved.id_tour,
      id: saved.id,
      es_promocion: saved.es_promocion,
      tipo: saved.es_promocion ? 'promocion' : 'tour',
      fecha_creacion: saved.createdAt
        ? saved.createdAt.toISOString()
        : fetchCreationDate || new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
    };

    // 1. Eliminar vectores anteriores para evitar duplicados
    if (existingVectors.length > 0) {
      await this.n8nVectorsRepository.remove(existingVectors);
    }

    // 2. Generar todos los embeddings en paralelo e insertar los nuevos chunks
    const vectorRows = await Promise.all(
      chunksPayload.map(async (chunk) => {
        const embedding = await this.embeddingsService.embed(chunk.text);
        const chunkMetadata = {
          ...metadataBase,
          chunk_type: chunk.chunk_type,
          ...(chunk.chunk_index !== undefined ? { chunk_index: chunk.chunk_index } : {}),
        };
        return this.n8nVectorsRepository.create({
          text: chunk.text || null,
          metadata: chunkMetadata,
          embedding,
          fileId: null,
          modifiedTime: new Date(),
        });
      }),
    );
    await this.n8nVectorsRepository.save(vectorRows);
    await Promise.all([
      this.cacheManager.del(CACHE_KEY_ACTIVOS),
      this.cacheManager.del(CACHE_KEY_TODOS),
    ]);

    return saved;
  }

  async findAll(soloActivos = true) {
    const cacheKey = soloActivos ? CACHE_KEY_ACTIVOS : CACHE_KEY_TODOS;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const where = soloActivos ? { is_active: true } : {};
    const tours = await this.toursMaestroRepository.find({ where, order: { id: 'DESC' } });

    if (tours.length === 0) {
      await this.cacheManager.set(cacheKey, [], CACHE_TTL);
      return [];
    }

    // Tours sin límite de cupos: cupos_disponibles = null directamente
    const toursConCupos = tours.filter((t) => t.cupos !== null);
    const cuposDisponiblesPorTour = new Map<number, number | null>();
    for (const t of tours) cuposDisponiblesPorTour.set(t.id, null);

    if (toursConCupos.length > 0) {
      const tourIds = toursConCupos.map((t) => t.id);

      // 1 query: reservas activas con conteo de integrantes agrupadas por tour
      const rawReservas = await this.reservaRepository
        .createQueryBuilder('r')
        .innerJoin('r.tour', 't')
        .leftJoin('r.integrantes', 'i')
        .select('r.id', 'id')
        .addSelect('r.estado', 'estado')
        .addSelect('t.id', 'tour_id')
        .addSelect('COUNT(i.id)', 'integrantes_count')
        .where('t.id IN (:...tourIds)', { tourIds })
        .andWhere('r.estado != :cancelado', { cancelado: 'cancelado' })
        .groupBy('r.id')
        .addGroupBy('r.estado')
        .addGroupBy('t.id')
        .getRawMany<{ id: string; estado: string; tour_id: string; integrantes_count: string }>();

      const pendientesIds = rawReservas
        .filter((r) => r.estado !== 'al dia')
        .map((r) => Number(r.id));

      const reservasConPago = new Set<number>();
      if (pendientesIds.length > 0) {
        // 1 query: pagos validados para todas las reservas pendientes
        const pagos = await this.pagoRepository
          .createQueryBuilder('p')
          .select('DISTINCT p.reserva_id', 'reserva_id')
          .where('p.reserva_id IN (:...ids)', { ids: pendientesIds })
          .andWhere('p.is_validated = true')
          .getRawMany<{ reserva_id: number }>();
        pagos.forEach((p) => reservasConPago.add(Number(p.reserva_id)));
      }

      // Calcular cupos usados por tour en memoria
      const cuposUsadosPorTour = new Map<number, number>();
      for (const r of rawReservas) {
        const rid = Number(r.id);
        if (r.estado === 'al dia' || reservasConPago.has(rid)) {
          const tourId = Number(r.tour_id);
          const personas = 1 + Number(r.integrantes_count);
          cuposUsadosPorTour.set(tourId, (cuposUsadosPorTour.get(tourId) ?? 0) + personas);
        }
      }

      for (const t of toursConCupos) {
        const usados = cuposUsadosPorTour.get(t.id) ?? 0;
        cuposDisponiblesPorTour.set(t.id, Math.max(0, t.cupos! - usados));
      }
    }

    const result = tours.map((t) => ({
      ...this.normalize(t),
      cupos_disponibles: cuposDisponiblesPorTour.get(t.id) ?? null,
    }));
    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findOne(id: number) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour con id ${id} no encontrado`);
    }
    return this.enriquecerConCupos(this.normalize(tour));
  }

  async findDetalle(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);

    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId } },
      order: { fecha_creacion: 'DESC' },
    });

    const cuposUsados = await this.calcularCuposUsados(tourId);
    const cuposDisponibles = tour.cupos !== null
      ? Math.max(0, tour.cupos - cuposUsados)
      : null;

    // Una sola query trae todos los pagos validados de todas las reservas
    const reservaIds = reservas.map((r) => r.id);
    const todosPagosValidados = reservaIds.length > 0
      ? await this.pagoRepository.find({
          where: { reserva_id: In(reservaIds), is_validated: true },
          select: ['reserva_id', 'monto'],
        })
      : [];

    const montoPorReserva = new Map<number, number>();
    const reservasConPago = new Set<number>();
    for (const p of todosPagosValidados) {
      const rid = p.reserva_id!;
      montoPorReserva.set(rid, (montoPorReserva.get(rid) ?? 0) + Number(p.monto));
      reservasConPago.add(rid);
    }

    const reservasDetalle = reservas.map((r) => {
        const valor_cancelado = montoPorReserva.get(r.id) ?? 0;
        const tienePageValidado = reservasConPago.has(r.id);
        const ocupaCupo = r.estado === 'al dia' || (r.estado !== 'cancelado' && tienePageValidado);

        const valor_total = Number(r.valor_total);
        const costo_servicios = (r.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
        const valor_tour_snapshot = valor_total - costo_servicios;

        return {
          id: r.id,
          id_reserva: r.id_reserva,
          estado: r.estado,
          notas: r.notas,
          fecha_creacion: r.fecha_creacion,
          ocupa_cupo: ocupaCupo,
          valor_total,
          valor_tour_snapshot,
          costo_servicios,
          valor_cancelado,
          saldo_pendiente: valor_total - valor_cancelado,
          responsable: r.responsable
            ? {
                id: r.responsable.id,
                nombre: r.responsable.nombre,
                telefono: r.responsable.telefono,
                correo: r.responsable.correo,
                tipo_documento: r.responsable.tipo_documento,
                documento: r.responsable.documento,
              }
            : null,
          integrantes: (r.integrantes ?? []).map((i) => ({
            id: i.id,
            nombre: i.nombre,
            telefono: i.telefono,
            fecha_nacimiento: i.fecha_nacimiento,
            tipo_documento: i.tipo_documento,
            documento: i.documento,
          })),
          total_personas: 1 + (r.integrantes?.length ?? 0),
        };
      });

    // Lista plana de todos los pasajeros que ocupan cupo
    const pasajeros: Array<{
      nombre: string;
      tipo_documento: string | null;
      documento: string | null;
      telefono: string | null;
      tipo: 'responsable' | 'integrante';
      reserva_id: string;
      estado_reserva: string;
    }> = [];

    for (const r of reservasDetalle) {
      if (!r.ocupa_cupo) continue;
      if (r.responsable) {
        pasajeros.push({
          nombre: r.responsable.nombre,
          tipo_documento: r.responsable.tipo_documento ?? null,
          documento: r.responsable.documento ?? null,
          telefono: r.responsable.telefono ?? null,
          tipo: 'responsable',
          reserva_id: r.id_reserva,
          estado_reserva: r.estado,
        });
      }
      for (const i of r.integrantes) {
        pasajeros.push({
          nombre: i.nombre,
          tipo_documento: i.tipo_documento ?? null,
          documento: i.documento ?? null,
          telefono: i.telefono ?? null,
          tipo: 'integrante',
          reserva_id: r.id_reserva,
          estado_reserva: r.estado,
        });
      }
    }

    return {
      tour: {
        ...this.normalize(tour),
        cupos_usados: cuposUsados,
        cupos_disponibles: cuposDisponibles,
      },
      reservas: reservasDetalle,
      pasajeros,
      total_pasajeros: pasajeros.length,
    };
  }

  async calcularCuposUsados(tourId: number): Promise<number> {
    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId } },
    });

    const activas = reservas.filter((r) => r.estado !== 'cancelado');
    if (activas.length === 0) return 0;

    // Una sola query: reservas pendientes que tienen al menos un pago validado
    const pendientesIds = activas
      .filter((r) => r.estado !== 'al dia')
      .map((r) => r.id);

    const reservasConPago = new Set<number>();
    if (pendientesIds.length > 0) {
      const pagos = await this.pagoRepository
        .createQueryBuilder('p')
        .select('DISTINCT p.reserva_id', 'reserva_id')
        .where('p.reserva_id IN (:...ids)', { ids: pendientesIds })
        .andWhere('p.is_validated = true')
        .getRawMany<{ reserva_id: number }>();
      pagos.forEach((p) => reservasConPago.add(Number(p.reserva_id)));
    }

    return activas.reduce((total, r) => {
      const personas = 1 + (r.integrantes?.length ?? 0);
      if (r.estado === 'al dia' || reservasConPago.has(r.id)) {
        return total + personas;
      }
      return total;
    }, 0);
  }

  private async enriquecerConCupos(tour: ToursMaestro) {
    if (tour.cupos === null) {
      return { ...tour, cupos_disponibles: null };
    }
    const usados = await this.calcularCuposUsados(tour.id);
    return { ...tour, cupos_disponibles: Math.max(0, tour.cupos - usados) };
  }

  private normalize(tour: ToursMaestro): ToursMaestro {
    tour.precio_por_pareja = tour.precio_por_pareja ?? false;
    return tour;
  }

  /**
   * Búsqueda por similitud en n8n_vectors (operador <=> cosine distance).
   * Devuelve filas con text, metadata (id_tour, id) y similarity para que n8n o el cliente usen.
   */
  /**
   * Genera el texto estructurado en fragmentos semánticos (chunks) para el embedding del tour.
   */
  private generateSemanticChunks(data: {
    nombre_tour: string;
    agencia?: string | null;
    precio?: number | null;
    precios?: TourPrecio[] | null;
    punto_partida?: string | null;
    llegada?: string | null;
    inclusions?: string[] | null;
    exclusions?: string[] | null;
    itinerary?: any[] | null;
  }): Array<{
    text: string;
    chunk_type: 'resumen' | 'detalles' | 'itinerario';
    chunk_index?: number;
  }> {
    const chunks: Array<{
      text: string;
      chunk_type: 'resumen' | 'detalles' | 'itinerario';
      chunk_index?: number;
    }> = [];

    // Construir texto de precios (precio base + precios por categoría, ambos siempre incluidos)
    const preciosLineas: string[] = [];
    if (data.precio != null) {
      preciosLineas.push(`- Precio base: $${Number(data.precio).toLocaleString('es-CO')}`);
    }
    const preciosActivos = (data.precios ?? []).filter((p) => p.activo);
    for (const p of preciosActivos) {
      let linea = `- ${p.descripcion}`;
      if (p.edad_min != null && p.edad_max != null)
        linea += ` (${p.edad_min}-${p.edad_max} años)`;
      else if (p.edad_min != null) linea += ` (desde ${p.edad_min} años)`;
      else if (p.edad_max != null) linea += ` (hasta ${p.edad_max} años)`;
      if (p.punto_partida) linea += ` desde ${p.punto_partida}`;
      linea += `: $${Number(p.precio).toLocaleString('es-CO')}`;
      preciosLineas.push(linea);
    }
    const preciosText = preciosLineas.length > 0 ? `PRECIOS:\n${preciosLineas.join('\n')}` : '';

    // 1. Resumen Ejecutivo
    const resumenParts = [
      `TOUR RESUMEN: ${data.nombre_tour}`,
      data.agencia ? `Agencia: ${data.agencia}` : '',
      preciosText,
      data.punto_partida ? `Punto de Partida: ${data.punto_partida}` : '',
      data.llegada ? `Destino/Llegada: ${data.llegada}` : '',
    ];
    chunks.push({
      text: resumenParts.filter(Boolean).join('\n'),
      chunk_type: 'resumen',
      chunk_index: 0,
    });

    // 2. Detalles Técnicos (Inclusiones y Exclusiones)
    if (
      (data.inclusions && data.inclusions.length > 0) ||
      (data.exclusions && data.exclusions.length > 0)
    ) {
      const detallesParts = [
        `DETALLES TOUR: ${data.nombre_tour}`,
        data.inclusions?.length
          ? `INCLUYE:\n- ${data.inclusions.join('\n- ')}`
          : '',
        data.exclusions?.length
          ? `NO INCLUYE:\n- ${data.exclusions.join('\n- ')}`
          : '',
      ];
      chunks.push({
        text: detallesParts.filter(Boolean).join('\n\n'),
        chunk_type: 'detalles',
        chunk_index: 0,
      });
    }

    // 3. Pasos del Itinerario (Un vector por día)
    if (data.itinerary && data.itinerary.length > 0) {
      data.itinerary.forEach((dia, index) => {
        const itinerarioTexto = `ITINERARIO TOUR (${data.nombre_tour}) - Día ${dia.dia_numero}: ${dia.titulo}\nDescripción: ${dia.descripcion}`;
        chunks.push({
          text: itinerarioTexto,
          chunk_type: 'itinerario',
          chunk_index: dia.dia_numero || index + 1,
        });
      });
    }

    return chunks;
  }

  async searchByEmbedding(
    queryEmbedding: number[],
    limit = 10,
  ): Promise<Array<N8nVector & { similarity?: number }>> {
    const embeddingSql = toSql(queryEmbedding);
    const qb = this.n8nVectorsRepository
      .createQueryBuilder('v')
      .select(['v.id', 'v.text', 'v.metadata', 'v.fileId', 'v.modifiedTime'])
      .addSelect('1 - (v.embedding <=> :embedding::vector)', 'similarity')
      .where('v.embedding IS NOT NULL')
      .orderBy('v.embedding <=> :embedding::vector')
      .setParameter('embedding', embeddingSql)
      .limit(limit);

    const raw = await qb.getRawAndEntities();
    return raw.entities.map((entity, i) => ({
      ...entity,
      similarity: parseFloat(String(raw.raw[i]?.similarity ?? '0')),
    }));
  }
}
