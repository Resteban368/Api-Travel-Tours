"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToursService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const utils_1 = require("pgvector/utils");
const tours_maestro_entity_1 = require("./entities/tours-maestro.entity");
const n8n_vector_entity_1 = require("./entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let ToursService = class ToursService {
    toursMaestroRepository;
    n8nVectorsRepository;
    embeddingsService;
    constructor(toursMaestroRepository, n8nVectorsRepository, embeddingsService) {
        this.toursMaestroRepository = toursMaestroRepository;
        this.n8nVectorsRepository = n8nVectorsRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(dto) {
        const tour = this.toursMaestroRepository.create({
            id_tour: dto.id_tour ?? null,
            nombre_tour: dto.nombre_tour,
            agencia: dto.agencia ?? null,
            fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : null,
            fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
            precio: dto.precio ?? null,
            punto_partida: dto.punto_partida ?? null,
            hora_partida: dto.hora_partida ?? null,
            llegada: dto.llegada ?? null,
            url_imagen: dto.url_imagen ?? null,
            link_pdf: dto.link_pdf ?? null,
            inclusions: dto.inclusions ?? null,
            exclusions: dto.exclusions ?? null,
            itinerary: dto.itinerary ?? null,
            estado: dto.estado ?? true,
            es_promocion: dto.es_promocion ?? false,
            is_active: dto.is_active ?? true,
            es_borrador: dto.es_borrador ?? false,
            sede_id: dto.sede_id ?? null,
        });
        const saved = await this.toursMaestroRepository.save(tour);
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
        const metadataBase = {
            id_tour: saved.id_tour,
            id: saved.id,
            es_promocion: saved.es_promocion,
            tipo: saved.es_promocion ? 'promocion' : 'tour',
            fecha_creacion: saved.createdAt
                ? saved.createdAt.toISOString()
                : new Date().toISOString(),
            fecha_modificacion: new Date().toISOString(),
        };
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
    async update(id, dto) {
        const tour = await this.toursMaestroRepository.findOne({ where: { id } });
        if (!tour) {
            throw new common_1.NotFoundException(`Tour con id ${id} no encontrado`);
        }
        if (dto.id_tour !== undefined)
            tour.id_tour = dto.id_tour;
        if (dto.nombre_tour !== undefined)
            tour.nombre_tour = dto.nombre_tour;
        if (dto.agencia !== undefined)
            tour.agencia = dto.agencia;
        if (dto.fecha_inicio !== undefined)
            tour.fecha_inicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : null;
        if (dto.fecha_fin !== undefined)
            tour.fecha_fin = dto.fecha_fin ? new Date(dto.fecha_fin) : null;
        if (dto.precio !== undefined)
            tour.precio = dto.precio;
        if (dto.punto_partida !== undefined)
            tour.punto_partida = dto.punto_partida;
        if (dto.hora_partida !== undefined)
            tour.hora_partida = dto.hora_partida;
        if (dto.llegada !== undefined)
            tour.llegada = dto.llegada;
        if (dto.url_imagen !== undefined)
            tour.url_imagen = dto.url_imagen;
        if (dto.link_pdf !== undefined)
            tour.link_pdf = dto.link_pdf;
        if (dto.inclusions !== undefined)
            tour.inclusions = dto.inclusions;
        if (dto.exclusions !== undefined)
            tour.exclusions = dto.exclusions;
        if (dto.itinerary !== undefined)
            tour.itinerary = dto.itinerary;
        if (dto.estado !== undefined)
            tour.estado = dto.estado;
        if (dto.es_promocion !== undefined)
            tour.es_promocion = dto.es_promocion;
        if (dto.is_active !== undefined)
            tour.is_active = dto.is_active;
        if (dto.es_borrador !== undefined)
            tour.es_borrador = dto.es_borrador;
        if (dto.sede_id !== undefined)
            tour.sede_id = dto.sede_id ?? null;
        const saved = await this.toursMaestroRepository.save(tour);
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
        const existingVectors = await this.n8nVectorsRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'id' = :id", { id: String(id) })
            .getMany();
        const fetchCreationDate = existingVectors.find((v) => v.metadata?.fecha_creacion)?.metadata?.fecha_creacion;
        const metadataBase = {
            id_tour: saved.id_tour,
            id: saved.id,
            es_promocion: saved.es_promocion,
            tipo: saved.es_promocion ? 'promocion' : 'tour',
            fecha_creacion: saved.createdAt
                ? saved.createdAt.toISOString()
                : fetchCreationDate || new Date().toISOString(),
            fecha_modificacion: new Date().toISOString(),
        };
        if (existingVectors.length > 0) {
            await this.n8nVectorsRepository.remove(existingVectors);
        }
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
    async findAll() {
        return this.toursMaestroRepository.find({
            order: { id: 'DESC' },
        });
    }
    async findOne(id) {
        const tour = await this.toursMaestroRepository.findOne({ where: { id } });
        if (!tour) {
            throw new common_1.NotFoundException(`Tour con id ${id} no encontrado`);
        }
        return tour;
    }
    generateSemanticChunks(data) {
        const chunks = [];
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
        if ((data.inclusions && data.inclusions.length > 0) ||
            (data.exclusions && data.exclusions.length > 0)) {
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
    async searchByEmbedding(queryEmbedding, limit = 10) {
        const embeddingSql = (0, utils_1.toSql)(queryEmbedding);
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
};
exports.ToursService = ToursService;
exports.ToursService = ToursService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tours_maestro_entity_1.ToursMaestro)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], ToursService);
//# sourceMappingURL=tours.service.js.map