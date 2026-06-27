import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { toSql } from 'pgvector/utils';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { TourPrecio } from './entities/tour-precio.entity';
import { TourPrecioGrupal } from './entities/tour-precio-grupal.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { AuditoriaTour } from './entities/auditoria-tour.entity';
import { TourBusAgente } from './entities/tour-bus-agente.entity';
import { TourSalida } from './entities/tour-salida.entity';
import { BusLayout } from '../bus-layouts/entities/bus-layout.entity';
import { AsientoSeleccionado } from '../seleccion-asientos/entities/asiento-seleccionado.entity';
import { SeleccionAsientosService } from '../seleccion-asientos/seleccion-asientos.service';
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
    @InjectRepository(TourPrecioGrupal)
    private readonly tourPrecioGrupalRepository: Repository<TourPrecioGrupal>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorsRepository: Repository<N8nVector>,
    @InjectRepository(AuditoriaTour)
    private readonly auditoriaTourRepository: Repository<AuditoriaTour>,
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepository: Repository<PagoRealizado>,
    @InjectRepository(BusLayout)
    private readonly busLayoutRepository: Repository<BusLayout>,
    @InjectRepository(TourBusAgente)
    private readonly tourBusAgenteRepository: Repository<TourBusAgente>,
    @InjectRepository(AsientoSeleccionado)
    private readonly asientoSeleccionadoRepository: Repository<AsientoSeleccionado>,
    @InjectRepository(TourSalida)
    private readonly tourSalidaRepository: Repository<TourSalida>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly seleccionAsientosService: SeleccionAsientosService,
    private readonly auditoriaTourService: AuditoriaTourService,
    private readonly auditoriaGeneralService: AuditoriaGeneralService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(dto: CreateTourDto, usuarioId?: number, usuarioNombre?: string): Promise<ToursMaestro> {
    const disponibilidadTipo = dto.disponibilidad_tipo ?? 'fecha_fija';

    if (disponibilidadTipo === 'fecha_fija' && (!dto.fecha_inicio || !dto.fecha_fin)) {
      throw new BadRequestException('fecha_inicio y fecha_fin son obligatorias para tours de tipo fecha_fija');
    }
    if (disponibilidadTipo === 'multiples_fechas' && (!dto.salidas || dto.salidas.length === 0)) {
      throw new BadRequestException('El campo salidas es obligatorio y debe tener al menos una entrada para tours de tipo multiples_fechas');
    }

    const tour = this.toursMaestroRepository.create({
      id_tour: dto.id_tour ?? null,
      nombre_tour: dto.nombre_tour,
      agencia: dto.agencia ?? null,
      fecha_inicio: disponibilidadTipo === 'fecha_fija' && dto.fecha_inicio ? new Date(dto.fecha_inicio) : null,
      fecha_fin: disponibilidadTipo === 'fecha_fija' && dto.fecha_fin ? new Date(dto.fecha_fin) : null,
      precio: dto.precio ?? null,
      precio_por_pareja: dto.precio_por_pareja ?? false,
      punto_partida: dto.punto_partida ?? null,
      hora_partida: dto.hora_partida ?? null,
      llegada: dto.llegada ?? null,
      url_imagen: dto.url_imagen ?? null,
      imagenes: dto.imagenes ?? null,
      link_pdf: dto.link_pdf ?? null,
      inclusions: dto.inclusions ?? null,
      exclusions: dto.exclusions ?? null,
      itinerary: dto.itinerary ?? null,
      descripcion: dto.descripcion ?? null,
      recomendaciones: dto.recomendaciones ?? null,
      cupos: disponibilidadTipo === 'permanente' ? null : (dto.cupos ?? null),
      tipo_tour: dto.tipo_tour,
      modo_precio: dto.modo_precio ?? 'individual',
      es_promocion: dto.es_promocion ?? false,
      is_active: dto.is_active ?? true,
      es_borrador: dto.es_borrador ?? false,
      sede_id: dto.sede_id ?? null,
      disponibilidad_tipo: disponibilidadTipo,
    });

    if (dto.bus_layout_ids && dto.bus_layout_ids.length > 0) {
      tour.busLayouts = await this.busLayoutRepository.findBy({ id: In(dto.bus_layout_ids) });
    } else {
      tour.busLayouts = [];
    }
    let saved: ToursMaestro;
    try {
      saved = await this.toursMaestroRepository.save(tour);
    } catch (err) {
      if (err?.code === '23505') {
        throw new ConflictException(
          `Ya existe un tour con el código ${dto.id_tour}. Usa un código diferente.`,
        );
      }
      throw err;
    }

    // Guardar salidas si el tour es de tipo multiples_fechas
    if (disponibilidadTipo === 'multiples_fechas' && dto.salidas && dto.salidas.length > 0) {
      const salidaEntidades = dto.salidas.map((s) =>
        this.tourSalidaRepository.create({
          tour: saved,
          fecha_inicio: s.fecha_inicio,
          fecha_fin: s.fecha_fin,
          cupos: s.cupos ?? null,
          label: s.label ?? null,
          is_active: true,
        }),
      );
      await this.tourSalidaRepository.save(salidaEntidades);
    }

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

    if (dto.precios_grupales && dto.precios_grupales.length > 0) {
      const grupalesEntidades = dto.precios_grupales.map((pg) =>
        this.tourPrecioGrupalRepository.create({
          tour: saved,
          min_personas: pg.min_personas,
          max_personas: pg.max_personas,
          precio: pg.precio,
          descripcion: pg.descripcion ?? null,
          activo: pg.activo ?? true,
        }),
      );
      await this.tourPrecioGrupalRepository.save(grupalesEntidades);
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
        modo_precio: saved.modo_precio,
        precios: savedPrecios.length,
        precios_grupales: dto.precios_grupales?.length ?? 0,
        cupos: saved.cupos,
        es_borrador: saved.es_borrador,
      },
    });

    if (!saved.is_active || saved.es_borrador) {
      return saved;
    }

    const salidasParaChunk = (dto.salidas ?? []).map((s) => ({
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      label: s.label ?? null,
      is_active: true,
    }));

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
      disponibilidad_tipo: saved.disponibilidad_tipo,
      fecha_inicio: saved.fecha_inicio,
      fecha_fin: saved.fecha_fin,
      salidas: salidasParaChunk,
      descripcion: saved.descripcion,
      recomendaciones: saved.recomendaciones,
    });

    const metadataBase: Record<string, any> = {
      id_tour: saved.id_tour,
      id: saved.id,
      es_promocion: saved.es_promocion,
      tipo: saved.es_promocion ? 'promocion' : 'tour',
      tipo_tour: saved.tipo_tour ?? null,
      disponibilidad_tipo: saved.disponibilidad_tipo,
      salidas: salidasParaChunk,
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
    const tour = await this.toursMaestroRepository.findOne({ 
      where: { id },
      relations: ['busLayouts']
    });
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
    if (dto.imagenes !== undefined) tour.imagenes = dto.imagenes;
    if (dto.link_pdf !== undefined) tour.link_pdf = dto.link_pdf;
    if (dto.inclusions !== undefined) tour.inclusions = dto.inclusions;
    if (dto.exclusions !== undefined) tour.exclusions = dto.exclusions;
    if (dto.itinerary !== undefined) tour.itinerary = dto.itinerary;
    if (dto.descripcion !== undefined) tour.descripcion = dto.descripcion ?? null;
    if (dto.recomendaciones !== undefined) tour.recomendaciones = dto.recomendaciones ?? null;
    if (dto.es_promocion !== undefined) tour.es_promocion = dto.es_promocion;
    if (dto.is_active !== undefined) {
      track('is_active', tour.is_active, dto.is_active);
      tour.is_active = dto.is_active;
      tour.deleted_at = dto.is_active ? null : new Date();
    }
    track('cupos', tour.cupos, dto.cupos);
    if (dto.cupos !== undefined) tour.cupos = dto.cupos ?? null;
    track('tipo_tour', tour.tipo_tour, dto.tipo_tour);
    if (dto.tipo_tour !== undefined) tour.tipo_tour = dto.tipo_tour;
    track('modo_precio', tour.modo_precio, dto.modo_precio);
    if (dto.modo_precio !== undefined) tour.modo_precio = dto.modo_precio;
    track('es_borrador', tour.es_borrador, dto.es_borrador);
    if (dto.es_borrador !== undefined) tour.es_borrador = dto.es_borrador;
    if (dto.sede_id !== undefined) tour.sede_id = dto.sede_id ?? null;
    if (dto.disponibilidad_tipo !== undefined) {
      tour.disponibilidad_tipo = dto.disponibilidad_tipo;
      if (dto.disponibilidad_tipo === 'permanente') {
        tour.cupos = null;
        tour.fecha_inicio = null;
        tour.fecha_fin = null;
      }
      if (dto.disponibilidad_tipo === 'multiples_fechas') {
        tour.fecha_inicio = null;
        tour.fecha_fin = null;
      }
    }
    if (dto.bus_layout_ids !== undefined) {
      const currentBusIds = tour.busLayouts?.map((b) => b.id) || [];
      const newBusIds = dto.bus_layout_ids;

      const removedBusIds = currentBusIds.filter((bid) => !newBusIds.includes(bid));
      const addedBusIds   = newBusIds.filter((bid) => !currentBusIds.includes(bid));

      if (removedBusIds.length > 0) {
        // Reservas activas en los buses que se quitan
        const reservasAfectadas = await this.reservaRepository
          .createQueryBuilder('r')
          .innerJoin('r.tour', 't')
          .where('t.id = :tourId', { tourId: id })
          .andWhere('r.bus_layout_id IN (:...removedBusIds)', { removedBusIds })
          .andWhere('r.estado IN (:...estados)', { estados: ['pendiente', 'al dia'] })
          .select(['r.id'])
          .getMany();

        if (reservasAfectadas.length > 0) {
          const todosIds = reservasAfectadas.map((r) => r.id);

          // IDs de reservas que YA tienen asientos → no se migran
          const conAsientos = await this.asientoSeleccionadoRepository
            .createQueryBuilder('a')
            .where('a.reserva_id IN (:...ids)', { ids: todosIds })
            .select('DISTINCT a.reserva_id', 'reserva_id')
            .getRawMany<{ reserva_id: number }>();

          const idsConAsiento = new Set(conAsientos.map((r) => r.reserva_id));

          // Solo migrar las que NO tienen asientos seleccionados
          const idsSinAsiento = todosIds.filter((rid) => !idsConAsiento.has(rid));

          if (idsSinAsiento.length > 0) {
            const nuevoBusId = addedBusIds.length >= 1 ? addedBusIds[0] : null;
            await this.reservaRepository
              .createQueryBuilder()
              .update()
              .set({ bus_layout_id: nuevoBusId })
              .where('id IN (:...ids)', { ids: idsSinAsiento })
              .execute();
          }
        }

        // Limpiar asientos de agentes del bus removido
        await this.tourBusAgenteRepository.delete({
          tour_id: id,
          bus_layout_id: In(removedBusIds),
        });
      }

      tour.busLayouts = dto.bus_layout_ids.length > 0
        ? await this.busLayoutRepository.findBy({ id: In(dto.bus_layout_ids) })
        : [];
    }

    const saved = await this.toursMaestroRepository.save(tour);

    // Reemplazar salidas si se enviaron en el DTO
    if (dto.salidas !== undefined) {
      await this.tourSalidaRepository.delete({ tour: { id: saved.id } });
      if (dto.salidas.length > 0) {
        const salidaEntidades = dto.salidas.map((s) =>
          this.tourSalidaRepository.create({
            tour: saved,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            cupos: s.cupos ?? null,
            label: s.label ?? null,
            is_active: true,
          }),
        );
        await this.tourSalidaRepository.save(salidaEntidades);
      }
    }

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

    // Reemplazar precios grupales si se enviaron en el DTO
    if (dto.precios_grupales !== undefined) {
      await this.tourPrecioGrupalRepository.delete({ tour: { id: saved.id } });
      if (dto.precios_grupales.length > 0) {
        const grupalesEntidades = dto.precios_grupales.map((pg) =>
          this.tourPrecioGrupalRepository.create({
            tour: saved,
            min_personas: pg.min_personas,
            max_personas: pg.max_personas,
            precio: pg.precio,
            descripcion: pg.descripcion ?? null,
            activo: pg.activo ?? true,
          }),
        );
        await this.tourPrecioGrupalRepository.save(grupalesEntidades);
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

    const salidasActuales = saved.disponibilidad_tipo === 'multiples_fechas'
      ? await this.tourSalidaRepository.find({ where: { tour: { id: saved.id }, is_active: true }, order: { fecha_inicio: 'ASC' } })
      : [];

    const salidasParaChunk = salidasActuales.map((s) => ({
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      label: s.label ?? null,
      is_active: s.is_active,
    }));

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
      disponibilidad_tipo: saved.disponibilidad_tipo,
      fecha_inicio: saved.fecha_inicio,
      fecha_fin: saved.fecha_fin,
      salidas: salidasParaChunk,
      descripcion: saved.descripcion,
      recomendaciones: saved.recomendaciones,
    });

    const fetchCreationDate = existingVectors.find(
      (v) => v.metadata?.fecha_creacion,
    )?.metadata?.fecha_creacion;

    const metadataBase: Record<string, any> = {
      id_tour: saved.id_tour,
      id: saved.id,
      es_promocion: saved.es_promocion,
      tipo: saved.es_promocion ? 'promocion' : 'tour',
      tipo_tour: saved.tipo_tour ?? null,
      disponibilidad_tipo: saved.disponibilidad_tipo,
      salidas: salidasParaChunk,
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

  async findHistorico() {
    const tours = await this.toursMaestroRepository.find({
      where: { es_finalizado: true },
      order: { id: 'DESC' },
    });
    return tours.map((t) => this.normalize(t));
  }

  async findAll(soloActivos = true) {
    const cacheKey = soloActivos ? CACHE_KEY_ACTIVOS : CACHE_KEY_TODOS;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const where = soloActivos ? { is_active: true, es_finalizado: false } : {};
    const tours = await this.toursMaestroRepository.find({ where, order: { id: 'DESC' } });

    if (tours.length === 0) {
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
        .andWhere('r.estado NOT IN (:...estadosCancelados)', { estadosCancelados: ['cancelado', 'cancelada'] })
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

  async duplicarTour(id: number, usuarioId?: number, usuarioNombre?: string) {
    const original = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!original) throw new NotFoundException(`Tour con id ${id} no encontrado`);

    const copia = this.toursMaestroRepository.create({
      nombre_tour:      original.nombre_tour,
      agencia:          original.agencia,
      precio:           original.precio,
      precio_por_pareja: original.precio_por_pareja,
      punto_partida:    original.punto_partida,
      hora_partida:     original.hora_partida,
      llegada:          original.llegada,
      url_imagen:       original.url_imagen,
      link_pdf:         original.link_pdf,
      inclusions:       original.inclusions,
      exclusions:       original.exclusions,
      itinerary:        original.itinerary,
      cupos:            original.cupos,
      es_promocion:     original.es_promocion,
      sede_id:          original.sede_id,
      // campos reseteados
      id_tour:          null,
      fecha_inicio:     null,
      fecha_fin:        null,
      es_borrador:      true,
      is_active:        true,
      es_finalizado:    false,
      deleted_at:       null,
      busLayouts:       [],
    });

    const saved = await this.toursMaestroRepository.save(copia);

    await Promise.all([
      this.cacheManager.del(CACHE_KEY_ACTIVOS),
      this.cacheManager.del(CACHE_KEY_TODOS),
    ]);

    if (usuarioId) {
      await this.auditoriaGeneralService.registrar({
        modulo: 'tours',
        operacion: 'CREAR',
        documento_id: saved.id,
        detalle: { duplicado_de: id },
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
      });
    }

    return { id: saved.id, es_borrador: true, duplicado_de: id, mensaje: 'Tour duplicado como borrador' };
  }

  async finalizarTour(id: number, usuarioId?: number, usuarioNombre?: string) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!tour) throw new NotFoundException(`Tour con id ${id} no encontrado`);
    if (tour.es_finalizado) return { mensaje: 'El tour ya estaba finalizado' };

    tour.es_finalizado = true;
    await this.toursMaestroRepository.save(tour);

    // Eliminar vectores del tour de n8n_vectors
    const vectors = await this.n8nVectorsRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'id' = :id", { id: String(id) })
      .getMany();
    if (vectors.length > 0) {
      await this.n8nVectorsRepository.remove(vectors);
    }

    await Promise.all([
      this.cacheManager.del(CACHE_KEY_ACTIVOS),
      this.cacheManager.del(CACHE_KEY_TODOS),
    ]);

    if (usuarioId) {
      await this.auditoriaGeneralService.registrar({
        modulo: 'tours',
        operacion: 'ACTUALIZAR',
        documento_id: id,
        detalle: { es_finalizado: true },
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
      });
    }

    return { id, es_finalizado: true, mensaje: 'Tour finalizado correctamente' };
  }

  async findOne(id: number) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour con id ${id} no encontrado`);
    }
    const base = await this.enriquecerConCupos(this.normalize(tour));
    if (tour.disponibilidad_tipo === 'multiples_fechas') {
      const salidas = await this.findSalidas(id);
      return { ...base, salidas };
    }
    return base;
  }

  async findSalidas(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);

    const salidas = await this.tourSalidaRepository.find({
      where: { tour: { id: tourId } },
      order: { fecha_inicio: 'ASC' },
    });

    return Promise.all(
      salidas.map(async (s) => {
        const cuposLimite = s.cupos ?? tour.cupos;
        if (cuposLimite === null) {
          return { ...s, cupos_disponibles: null };
        }
        const usados = await this.calcularCuposUsadosPorSalida(s.id);
        return { ...s, cupos_disponibles: Math.max(0, cuposLimite - usados) };
      }),
    );
  }

  async getBusesDisponibilidad(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({
      where: { id: tourId },
      relations: ['busLayouts'],
    });
    if (!tour) throw new NotFoundException(`Tour ${tourId} no encontrado`);

    const busLayouts = tour.busLayouts ?? [];
    if (busLayouts.length === 0) return [];

    // Contar reservas activas (no canceladas) por bus para este tour
    const counts = await this.reservaRepository
      .createQueryBuilder('r')
      .select('r.bus_layout_id', 'bus_layout_id')
      .addSelect('COUNT(r.id)', 'count')
      .innerJoin('r.tour', 't')
      .where('t.id = :tourId', { tourId })
      .andWhere('r.estado NOT IN (:...estadosCancelados)', { estadosCancelados: ['cancelado', 'cancelada'] })
      .andWhere('r.bus_layout_id IS NOT NULL')
      .groupBy('r.bus_layout_id')
      .getRawMany();

    const countMap = new Map<number, number>();
    for (const row of counts) {
      countMap.set(Number(row.bus_layout_id), Number(row.count));
    }

    return busLayouts.map((bus) => {
      const ocupados = countMap.get(bus.id) ?? 0;
      return {
        bus_layout_id: bus.id,
        nombre: bus.nombre,
        total_asientos_cliente: bus.total_asientos_cliente,
        ocupados,
        disponibles: Math.max(0, bus.total_asientos_cliente - ocupados),
      };
    });
  }

  async getBusesManifiesto(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({
      where: { id: tourId },
      relations: ['busLayouts'],
    });
    if (!tour) throw new NotFoundException(`Tour ${tourId} no encontrado`);

    const busLayouts = tour.busLayouts ?? [];
    if (busLayouts.length === 0) return [];

    // Reservas activas del tour
    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId }, estado: In(['pendiente', 'al dia']) },
      order: { fecha_creacion: 'ASC' },
    });
    const reservasConBus = reservas.filter((r) => r.bus_layout_id !== null);

    // Batch: asientos confirmados de todas las reservas
    const reservaIds = reservas.map((r) => r.id);
    const asientosMap = await this.seleccionAsientosService.getAsientosConfirmadosBatch(reservaIds);

    // Mapa: numero_asiento+busId → reserva
    const asientoReservaMap = new Map<string, typeof reservasConBus[0]>();
    for (const r of reservasConBus) {
      const asientos = asientosMap.get(r.id) ?? [];
      for (const num of asientos) {
        asientoReservaMap.set(`${r.bus_layout_id}:${num}`, r);
      }
    }

    // Asientos de agentes por bus: busId → Set<numero>
    const agentesRegistros = await this.tourBusAgenteRepository.find({
      where: { tour_id: tourId },
    });
    const agentesMap = new Map<number, Set<string>>();
    for (const reg of agentesRegistros) {
      agentesMap.set(reg.bus_layout_id, new Set(reg.asientos_agentes ?? []));
    }

    const tourInfo = {
      id: tour.id,
      nombre_tour: tour.nombre_tour,
      fecha_inicio: tour.fecha_inicio,
      fecha_fin: tour.fecha_fin,
      hora_partida: tour.hora_partida,
      llegada: tour.llegada,
      punto_partida: tour.punto_partida,
      cupos: tour.cupos,
      es_promocion: tour.es_promocion,
      link_pdf: tour.link_pdf,
    };

    const buses = busLayouts.map((bus) => {
      const agentesSet = agentesMap.get(bus.id) ?? new Set<string>();

      const asientosOcupados = [...asientoReservaMap.entries()]
        .filter(([key]) => key.startsWith(`${bus.id}:`))
        .length;

      const asientosLayout = (bus.configuracion?.asientos ?? []).map((a) => {
          const esNormal = a.tipo === 'normal';
          const esAgente = esNormal && agentesSet.has(a.numero);
          const reserva = esNormal ? asientoReservaMap.get(`${bus.id}:${a.numero}`) : undefined;
          return {
            numero: a.numero,
            fila: a.fila,
            columna: a.columna,
            tipo: a.tipo,
            ...(esNormal && {
              agente: esAgente,
              reserva: reserva
                ? {
                    id: reserva.id,
                    id_reserva: reserva.id_reserva,
                    estado: reserva.estado,
                    responsable: reserva.responsable
                      ? {
                          nombre: reserva.responsable.nombre,
                          tipo_documento: reserva.responsable.tipo_documento,
                          documento: reserva.responsable.documento,
                          telefono: reserva.responsable.telefono,
                        }
                      : null,
                    integrantes: (reserva.integrantes ?? []).map((i) => ({
                      nombre: i.nombre,
                      tipo_documento: i.tipo_documento,
                      documento: i.documento,
                      telefono: i.telefono,
                      ocupa_asiento: i.ocupa_asiento ?? true,
                    })),
                  }
                : null,
            }),
          };
        });

      return {
        bus_layout_id: bus.id,
        nombre: bus.nombre,
        total_asientos_cliente: bus.total_asientos_cliente,
        asientos_agentes: agentesSet.size,
        asientos_ocupados: asientosOcupados,
        asientos_disponibles: Math.max(0, bus.total_asientos_cliente - asientosOcupados),
        configuracion: bus.configuracion,
        asientos: asientosLayout,
      };
    });

    const _personaJson = (p: any, esIntegrante = false) => p ? {
      nombre: p.nombre,
      tipo_documento: p.tipo_documento,
      documento: p.documento,
      telefono: p.telefono,
      ...(esIntegrante && { ocupa_asiento: p.ocupa_asiento ?? true }),
    } : null;

    const reservasSinAsientos = reservas
      .filter((r) => (asientosMap.get(r.id) ?? []).length === 0)
      .map((r) => ({
        id: r.id,
        id_reserva: r.id_reserva,
        estado: r.estado,
        bus_layout_id: r.bus_layout_id ?? null,
        fecha_creacion: r.fecha_creacion,
        responsable: _personaJson(r.responsable),
        integrantes: (r.integrantes ?? []).map((i) => _personaJson(i, true)),
      }));

    return { tour: tourInfo, buses, reservas_sin_asientos: reservasSinAsientos };
  }

  async autoAsignarAsientos(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({
      where: { id: tourId },
      relations: ['busLayouts'],
    });
    if (!tour) throw new NotFoundException(`Tour ${tourId} no encontrado`);

    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId }, estado: In(['pendiente', 'al dia']) },
      order: { fecha_creacion: 'ASC' },
    });
    const reservasConBus = reservas.filter((r) => r.bus_layout_id !== null);
    const reservasSinBus = reservas.filter((r) => r.bus_layout_id === null);

    const asientosMap = await this.seleccionAsientosService.getAsientosConfirmadosBatch(
      reservasConBus.map((r) => r.id),
    );

    // ── Construir estado de asientos libres por bus ───────────────────────────
    type BusState = { busId: number; asientosLibres: any[]; pointer: number };
    const busStateMap = new Map<number, BusState>();

    for (const bus of tour.busLayouts ?? []) {
      const todosAsientos = ((bus.configuracion as any)?.asientos ?? [])
        .filter((a: any) => a.tipo === 'normal')
        .sort((a: any, b: any) => a.fila !== b.fila ? a.fila - b.fila : a.columna - b.columna);

      const asientosTomados = new Set<string>();
      for (const r of reservasConBus.filter((r) => r.bus_layout_id === bus.id)) {
        (asientosMap.get(r.id) ?? []).forEach((n) => asientosTomados.add(n));
      }

      busStateMap.set(bus.id, {
        busId: bus.id,
        asientosLibres: todosAsientos.filter((a: any) => !asientosTomados.has(a.numero)),
        pointer: 0,
      });
    }

    let reservasAsignadas = 0;
    let reservasAutoAsignadas = 0;

    // ── Asignar asientos a reservas que ya tienen bus ─────────────────────────
    for (const reserva of reservasConBus) {
      if ((asientosMap.get(reserva.id) ?? []).length > 0) continue;
      const state = busStateMap.get(reserva.bus_layout_id!);
      if (!state) continue;
      const totalPersonas = 1 + (reserva.integrantes?.filter(i => i.ocupa_asiento !== false).length ?? 0);
      const slice = state.asientosLibres.slice(state.pointer, state.pointer + totalPersonas);
      state.pointer += slice.length;
      if (slice.length > 0) {
        await this.seleccionAsientosService.confirmarAsientosDirecto(
          reserva.id,
          slice.map((a: any) => a.numero),
        );
        reservasAsignadas++;
      }
    }

    // ── Asignar bus + asientos a reservas sin bus ─────────────────────────────
    for (const reserva of reservasSinBus) {
      const totalPersonas = 1 + (reserva.integrantes?.filter(i => i.ocupa_asiento !== false).length ?? 0);

      // Elegir el bus con más asientos libres que pueda alojar a esta reserva
      let bestState: BusState | null = null;
      let bestDisponibles = 0;
      for (const state of busStateMap.values()) {
        const disponibles = state.asientosLibres.length - state.pointer;
        if (disponibles >= totalPersonas && disponibles > bestDisponibles) {
          bestState = state;
          bestDisponibles = disponibles;
        }
      }

      if (!bestState) continue; // ningún bus tiene cupo suficiente

      // Persistir bus_layout_id en la reserva
      reserva.bus_layout_id = bestState.busId;
      await this.reservaRepository.save(reserva);

      // Asignar asientos
      const slice = bestState.asientosLibres.slice(bestState.pointer, bestState.pointer + totalPersonas);
      bestState.pointer += slice.length;
      if (slice.length > 0) {
        await this.seleccionAsientosService.confirmarAsientosDirecto(
          reserva.id,
          slice.map((a: any) => a.numero),
        );
        reservasAsignadas++;
        reservasAutoAsignadas++;
      }
    }

    const sinAsignar = reservasSinBus.filter((r) => r.bus_layout_id === null);

    return {
      ok: true,
      reservas_asignadas: reservasAsignadas,
      reservas_auto_asignadas_a_bus: reservasAutoAsignadas,
      reservas_sin_cupo: sinAsignar.length,
      ids_sin_cupo: sinAsignar.map((r) => r.id),
    };
  }

  async asignarAsientoAdmin(tourId: number, busLayoutId: number, reservaId: number, asientos: string[]) {
    return this.seleccionAsientosService.asignarAsientoAdmin(tourId, busLayoutId, reservaId, asientos);
  }

  async liberarAsiento(tourId: number, reservaId: number, numero: string) {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId, tour: { id: tourId } },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada en este tour');
    await this.seleccionAsientosService.liberarUnAsiento(reservaId, numero);
    return { ok: true };
  }

  async moverAsiento(
    tourId: number,
    busLayoutId: number,
    reservaIdOrigen: number,
    asientoOrigen: string,
    asientoDestino: string,
  ) {
    // Buscar quién tiene el asiento destino en este bus
    const todasReservas = await this.reservaRepository.find({
      where: { tour: { id: tourId }, bus_layout_id: busLayoutId, estado: In(['pendiente', 'al dia']) },
    });
    const idsReservas = todasReservas.map((r) => r.id);
    const asientosMap = await this.seleccionAsientosService.getAsientosConfirmadosBatch(idsReservas);

    let reservaIdDestino: number | null = null;
    for (const [rId, asientos] of asientosMap.entries()) {
      if (asientos.includes(asientoDestino)) {
        reservaIdDestino = rId;
        break;
      }
    }

    await this.seleccionAsientosService.moverAsiento(
      reservaIdOrigen,
      asientoOrigen,
      asientoDestino,
      reservaIdDestino,
    );
    return { ok: true };
  }

  async findDetalle(tourId: number) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);

    const reservas = await this.reservaRepository.find({
      where: { tour: { id: tourId } },
      relations: ['tour_salida'],
      order: { fecha_creacion: 'DESC' },
    });

    const cuposUsados = await this.calcularCuposUsados(tourId);
    const cuposDisponibles = tour.cupos !== null
      ? Math.max(0, tour.cupos - cuposUsados)
      : null;

    // Batch queries: pagos, asientos y tokens de selección
    const reservaIds = reservas.map((r) => r.id);
    const [todosPagosValidados, asientosMap, tokensMap] = await Promise.all([
      reservaIds.length > 0
        ? this.pagoRepository.find({
            where: { reserva_id: In(reservaIds), is_validated: true },
            select: ['reserva_id', 'monto'],
          })
        : Promise.resolve([]),
      this.seleccionAsientosService.getAsientosConfirmadosBatch(reservaIds),
      this.seleccionAsientosService.getTokensBatch(reservaIds),
    ]);

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
        const esCancelada = ['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? '');
        const ocupaCupo = r.estado === 'al dia' || (!esCancelada && tienePageValidado);

        // Recalcular valor_total igual que en reservas.service para consistencia
        const esGrupal = r.tour?.modo_precio === 'grupal';
        const usaPreciosCategorias =
          r.precio_responsable_aplicado != null ||
          (r.integrantes ?? []).some((i) => i.precio_aplicado != null);

        let valor_total: number;
        if (esGrupal || usaPreciosCategorias) {
          const totalPersonas = 1 + (r.integrantes?.length ?? 0);
          let tourSubtotal = 0;
          let descuentoTotal = 0;
          if (r.tour) {
            const modoPrecio = r.tour.modo_precio ?? (r.tour.precio_por_pareja ? 'pareja' : 'individual');
            if (esGrupal) {
              const grupoActivo = (r.tour.precios_grupales ?? [])
                .filter((pg) => pg.activo)
                .find((pg) => totalPersonas >= pg.min_personas && totalPersonas <= pg.max_personas);
              tourSubtotal = grupoActivo
                ? Number(grupoActivo.precio)
                : Number(r.tour.precio ?? 0) * totalPersonas;
            } else {
              const precioResp = Number(r.precio_responsable_aplicado ?? 0);
              const ints = r.integrantes ?? [];
              const descuento = Number(r.descuento_por_persona ?? 0);
              if (modoPrecio === 'pareja') {
                const unidades = Math.ceil(totalPersonas / 2);
                tourSubtotal = precioResp;
                for (let idx = 1; idx < ints.length; idx += 2) tourSubtotal += Number(ints[idx].precio_aplicado ?? 0);
                descuentoTotal = descuento * unidades;
              } else {
                tourSubtotal = precioResp + ints.reduce((sum, i) => sum + Number(i.precio_aplicado ?? 0), 0);
                descuentoTotal = descuento * totalPersonas;
              }
            }
          }
          const costo_servicios_calc = (r.servicios ?? []).reduce((sum, s) => sum + Number(s.costo ?? 0), 0);
          const totalVuelos = (r.vuelos ?? []).reduce((sum, v) => sum + Number(v.precio ?? 0), 0);
          const totalHoteles = (r.hoteles ?? []).reduce((sum, h) => sum + Number(h.valor ?? 0), 0);
          valor_total = tourSubtotal + costo_servicios_calc + totalVuelos + totalHoteles - descuentoTotal;
        } else {
          valor_total = Number(r.valor_total);
        }

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
          fecha_inicio_personalizada: r.fecha_inicio_personalizada ?? null,
          fecha_fin_personalizada: r.fecha_fin_personalizada ?? null,
          id_tour_salida: r.tour_salida?.id ?? null,
          tour_salida: r.tour_salida
            ? {
                id: r.tour_salida.id,
                fecha_inicio: r.tour_salida.fecha_inicio,
                fecha_fin: r.tour_salida.fecha_fin,
                label: r.tour_salida.label ?? null,
              }
            : null,
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
          bus_layout_id: r.bus_layout_id,
          asientos_bus: asientosMap.get(r.id) ?? [],
          seleccion_link: tokensMap.get(r.id) ?? null,
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

    // Calcular asientos ocupados por bus usando asientos confirmados reales
    const busReservaIds = new Map<number, number[]>();
    for (const r of reservas) {
      if (r.bus_layout_id && !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? '')) {
        const ids = busReservaIds.get(r.bus_layout_id) ?? [];
        ids.push(r.id);
        busReservaIds.set(r.bus_layout_id, ids);
      }
    }

    const normalizedTour = this.normalize(tour);
    const busLayoutsConDisponibilidad = (normalizedTour.busLayouts ?? []).map((bus: BusLayout) => {
      const reservaIdsDelBus = busReservaIds.get(bus.id) ?? [];
      const asientosOcupados = reservaIdsDelBus.reduce(
        (sum, rid) => sum + (asientosMap.get(rid)?.length ?? 0), 0,
      );
      return {
        ...bus,
        asientos_ocupados: asientosOcupados,
        asientos_disponibles: Math.max(0, bus.total_asientos_cliente - asientosOcupados),
      };
    });

    return {
      tour: {
        ...normalizedTour,
        busLayouts: busLayoutsConDisponibilidad,
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

    const activas = reservas.filter((r) => !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? ''));
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

  async addSalida(tourId: number, dto: { fecha_inicio: string; fecha_fin: string; cupos?: number; label?: string }) {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);
    if (tour.disponibilidad_tipo !== 'multiples_fechas') {
      throw new BadRequestException('Solo se pueden agregar salidas a tours de tipo multiples_fechas');
    }
    const salida = this.tourSalidaRepository.create({
      tour,
      fecha_inicio: dto.fecha_inicio,
      fecha_fin: dto.fecha_fin,
      cupos: dto.cupos ?? null,
      label: dto.label ?? null,
      is_active: true,
    });
    return this.tourSalidaRepository.save(salida);
  }

  async updateSalida(tourId: number, salidaId: number, dto: { fecha_inicio?: string; fecha_fin?: string; cupos?: number | null; label?: string | null; is_active?: boolean }) {
    const salida = await this.tourSalidaRepository.findOne({
      where: { id: salidaId, tour: { id: tourId } },
      relations: ['tour'],
    });
    if (!salida) throw new NotFoundException(`Salida ${salidaId} no encontrada para el tour ${tourId}`);
    if (dto.fecha_inicio !== undefined) salida.fecha_inicio = dto.fecha_inicio;
    if (dto.fecha_fin !== undefined) salida.fecha_fin = dto.fecha_fin;
    if (dto.cupos !== undefined) salida.cupos = dto.cupos ?? null;
    if (dto.label !== undefined) salida.label = dto.label ?? null;
    if (dto.is_active !== undefined) salida.is_active = dto.is_active;
    return this.tourSalidaRepository.save(salida);
  }

  async removeSalida(tourId: number, salidaId: number) {
    const salida = await this.tourSalidaRepository.findOne({
      where: { id: salidaId, tour: { id: tourId } },
      relations: ['tour'],
    });
    if (!salida) throw new NotFoundException(`Salida ${salidaId} no encontrada para el tour ${tourId}`);
    salida.is_active = false;
    await this.tourSalidaRepository.save(salida);
    return { id: salidaId, is_active: false, mensaje: 'Salida desactivada correctamente' };
  }

  async calcularCuposUsadosPorSalida(tourSalidaId: number): Promise<number> {
    const reservas = await this.reservaRepository.find({
      where: { tour_salida: { id: tourSalidaId } },
    });

    const activas = reservas.filter((r) => !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? ''));
    if (activas.length === 0) return 0;

    const pendientesIds = activas.filter((r) => r.estado !== 'al dia').map((r) => r.id);
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
      if (r.estado === 'al dia' || reservasConPago.has(r.id)) return total + personas;
      return total;
    }, 0);
  }

  async getAsientosAgentes(tourId: number, busLayoutId: number): Promise<{ asientos_agentes: string[] }> {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);

    const busAsignado = (tour.busLayouts ?? []).find((b) => b.id === busLayoutId);
    if (!busAsignado) throw new NotFoundException(`El bus ${busLayoutId} no está asignado al tour ${tourId}`);

    const registro = await this.tourBusAgenteRepository.findOne({
      where: { tour_id: tourId, bus_layout_id: busLayoutId },
    });
    return { asientos_agentes: registro?.asientos_agentes ?? [] };
  }

  async setAsientosAgentes(tourId: number, busLayoutId: number, asientos: string[]): Promise<{ asientos_agentes: string[] }> {
    const tour = await this.toursMaestroRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException(`Tour con id ${tourId} no encontrado`);

    const busAsignado = (tour.busLayouts ?? []).find((b) => b.id === busLayoutId);
    if (!busAsignado) throw new NotFoundException(`El bus ${busLayoutId} no está asignado al tour ${tourId}`);

    // Solo asientos de tipo 'normal' son válidos para agentes
    const asientosNormales = new Set(
      (busAsignado.configuracion?.asientos ?? [])
        .filter((a) => a.tipo === 'normal')
        .map((a) => a.numero),
    );
    const invalidos = asientos.filter((a) => !asientosNormales.has(a));
    if (invalidos.length > 0) {
      throw new BadRequestException(`Asientos inválidos o no disponibles: ${invalidos.join(', ')}`);
    }

    // Validar que ninguno ya esté confirmado por un cliente
    if (asientos.length > 0) {
      const reservasActivas = await this.reservaRepository.find({
        where: { tour: { id: tourId }, bus_layout_id: busLayoutId },
      });
      const reservaIds = reservasActivas.map((r) => r.id);
      if (reservaIds.length > 0) {
        const confirmadosMap = await this.seleccionAsientosService.getAsientosConfirmadosBatch(reservaIds);
        const confirmadosSet = new Set<string>();
        for (const lista of confirmadosMap.values()) lista.forEach((a) => confirmadosSet.add(a));
        const conflictos = asientos.filter((a) => confirmadosSet.has(a));
        if (conflictos.length > 0) {
          throw new BadRequestException(
            `Los asientos ${conflictos.join(', ')} ya están confirmados por clientes. Libéralos primero.`,
          );
        }
      }
    }

    const existing = await this.tourBusAgenteRepository.findOne({
      where: { tour_id: tourId, bus_layout_id: busLayoutId },
    });

    if (existing) {
      existing.asientos_agentes = asientos;
      await this.tourBusAgenteRepository.save(existing);
    } else {
      await this.tourBusAgenteRepository.save(
        this.tourBusAgenteRepository.create({ tour_id: tourId, bus_layout_id: busLayoutId, asientos_agentes: asientos }),
      );
    }

    return { asientos_agentes: asientos };
  }

  private async enriquecerConCupos(tour: ToursMaestro) {
    if (tour.cupos === null) {
      return { ...tour, cupos_disponibles: null };
    }
    const usados = await this.calcularCuposUsados(tour.id);
    return { ...tour, cupos_disponibles: Math.max(0, tour.cupos - usados) };
  }

  private normalize(tour: ToursMaestro): any {
    tour.precio_por_pareja = tour.precio_por_pareja ?? false;
    return {
      ...tour,
      bus_layout_ids: (tour.busLayouts ?? []).map((b) => b.id),
    };
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
    disponibilidad_tipo?: string | null;
    fecha_inicio?: Date | null;
    fecha_fin?: Date | null;
    salidas?: Array<{ fecha_inicio: string; fecha_fin: string; label?: string | null; is_active?: boolean }> | null;
    descripcion?: string | null;
    recomendaciones?: string | null;
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

    // Construir texto de disponibilidad según el tipo
    const fmtFecha = (f: string | Date | null | undefined): string => {
      if (!f) return '';
      const d = typeof f === 'string' ? new Date(f) : f;
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    let disponibilidadText = '';
    const tipo = data.disponibilidad_tipo ?? 'fecha_fija';
    if (tipo === 'permanente') {
      disponibilidadText = 'DISPONIBILIDAD:\n- Disponible todo el año, sin fecha fija, cupos ilimitados';
    } else if (tipo === 'multiples_fechas' && data.salidas && data.salidas.length > 0) {
      const salidasActivas = data.salidas.filter((s) => s.is_active !== false);
      const lineas = salidasActivas.map((s) => {
        const rango = `${fmtFecha(s.fecha_inicio)} – ${fmtFecha(s.fecha_fin)}`;
        return s.label ? `- ${s.label}: ${rango}` : `- ${rango}`;
      });
      disponibilidadText = `DISPONIBILIDAD:\n- Múltiples salidas disponibles\n${lineas.join('\n')}`;
    } else if (tipo === 'fecha_fija' && data.fecha_inicio && data.fecha_fin) {
      disponibilidadText = `DISPONIBILIDAD:\n- Fecha fija: ${fmtFecha(data.fecha_inicio)} – ${fmtFecha(data.fecha_fin)}`;
    }

    // 1. Resumen Ejecutivo
    const resumenParts = [
      `TOUR RESUMEN: ${data.nombre_tour}`,
      data.agencia ? `Agencia: ${data.agencia}` : '',
      data.descripcion ? `DESCRIPCIÓN:\n${data.descripcion}` : '',
      preciosText,
      data.punto_partida ? `Punto de Partida: ${data.punto_partida}` : '',
      data.llegada ? `Destino/Llegada: ${data.llegada}` : '',
      disponibilidadText,
    ];
    chunks.push({
      text: resumenParts.filter(Boolean).join('\n'),
      chunk_type: 'resumen',
      chunk_index: 0,
    });

    // 2. Detalles Técnicos (Inclusiones, Exclusiones y Recomendaciones)
    if (
      (data.inclusions && data.inclusions.length > 0) ||
      (data.exclusions && data.exclusions.length > 0) ||
      data.recomendaciones
    ) {
      const detallesParts = [
        `DETALLES TOUR: ${data.nombre_tour}`,
        data.inclusions?.length
          ? `INCLUYE:\n- ${data.inclusions.join('\n- ')}`
          : '',
        data.exclusions?.length
          ? `NO INCLUYE:\n- ${data.exclusions.join('\n- ')}`
          : '',
        data.recomendaciones
          ? `RECOMENDACIONES:\n${data.recomendaciones}`
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
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM tours_maestro t
        WHERE t.id = CAST(v.metadata->>'id' AS integer)
          AND (t.es_finalizado = true OR t.is_active = false)
      )`)
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
