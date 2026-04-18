import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { toSql } from 'pgvector/utils';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(ToursMaestro)
    private readonly toursMaestroRepository: Repository<ToursMaestro>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorsRepository: Repository<N8nVector>,
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepository: Repository<PagoRealizado>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async create(dto: CreateTourDto): Promise<ToursMaestro> {
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

    if (!saved.is_active || saved.es_borrador) {
      return saved;
    }

    const chunksPayload = this.generateSemanticChunks({
      nombre_tour: dto.nombre_tour,
      agencia: dto.agencia,
      precio: dto.precio,
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

    // Procesar cada chunk y guardarlo
    for (const chunk of chunksPayload) {
      const embedding = await this.embeddingsService.embed(chunk.text);

      const chunkMetadata = {
        ...metadataBase,
        chunk_type: chunk.chunk_type,
        ...(chunk.chunk_index !== undefined
          ? { chunk_index: chunk.chunk_index }
          : {}),
      };

      const vectorRow = this.n8nVectorsRepository.create({
        text: chunk.text || null,
        metadata: chunkMetadata,
        embedding,
        fileId: null,
        modifiedTime: new Date(),
      });
      await this.n8nVectorsRepository.save(vectorRow);
    }

    return saved;
  }

  async update(id: number, dto: UpdateTourDto): Promise<ToursMaestro> {
    const tour = await this.toursMaestroRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour con id ${id} no encontrado`);
    }

    if (dto.id_tour !== undefined) tour.id_tour = dto.id_tour;
    if (dto.nombre_tour !== undefined) tour.nombre_tour = dto.nombre_tour;
    if (dto.agencia !== undefined) tour.agencia = dto.agencia;
    if (dto.fecha_inicio !== undefined)
      tour.fecha_inicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : null;
    if (dto.fecha_fin !== undefined)
      tour.fecha_fin = dto.fecha_fin ? new Date(dto.fecha_fin) : null;
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
      tour.is_active = dto.is_active;
      tour.deleted_at = dto.is_active ? null : new Date();
    }
    if (dto.cupos !== undefined) tour.cupos = dto.cupos ?? null;
    if (dto.es_borrador !== undefined) tour.es_borrador = dto.es_borrador;
    if (dto.sede_id !== undefined) tour.sede_id = dto.sede_id ?? null;

    const saved = await this.toursMaestroRepository.save(tour);

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
      return saved;
    }

    const chunksPayload = this.generateSemanticChunks({
      nombre_tour: saved.nombre_tour,
      agencia: saved.agencia,
      precio: saved.precio,
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

    // 2. Insertar los nuevos chunks actualizados
    for (const chunk of chunksPayload) {
      const embedding = await this.embeddingsService.embed(chunk.text);

      const chunkMetadata = {
        ...metadataBase,
        chunk_type: chunk.chunk_type,
        ...(chunk.chunk_index !== undefined
          ? { chunk_index: chunk.chunk_index }
          : {}),
      };

      const vectorRow = this.n8nVectorsRepository.create({
        text: chunk.text || null,
        metadata: chunkMetadata,
        embedding,
        fileId: null,
        modifiedTime: new Date(),
      });
      await this.n8nVectorsRepository.save(vectorRow);
    }

    return saved;
  }

  async findAll(soloActivos = true) {
    const where = soloActivos ? { is_active: true } : {};
    const tours = await this.toursMaestroRepository.find({ where, order: { id: 'DESC' } });
    return Promise.all(tours.map((t) => this.enriquecerConCupos(this.normalize(t))));
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

        return {
          id: r.id,
          id_reserva: r.id_reserva,
          estado: r.estado,
          notas: r.notas,
          fecha_creacion: r.fecha_creacion,
          ocupa_cupo: ocupaCupo,
          valor_total,
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

    // 1. Resumen Ejecutivo
    const resumenParts = [
      `TOUR RESUMEN: ${data.nombre_tour}`,
      data.agencia ? `Agencia: ${data.agencia}` : '',
      data.precio ? `Precio base: $${data.precio}` : '',
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
