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
exports.SedesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sede_entity_1 = require("./entities/sede.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let SedesService = class SedesService {
    sedeRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(sedeRepository, n8nVectorRepository, embeddingsService) {
        this.sedeRepository = sedeRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(dto) {
        const sede = this.sedeRepository.create(dto);
        const saved = await this.sedeRepository.save(sede);
        await this.syncAllSedesToVector();
        return saved;
    }
    async findAll() {
        return this.sedeRepository.find({
            order: { id_sede: 'ASC' },
        });
    }
    async findOne(id) {
        const sede = await this.sedeRepository.findOne({
            where: { id_sede: id },
        });
        if (!sede) {
            throw new common_1.NotFoundException(`Sede con id ${id} no encontrada`);
        }
        return sede;
    }
    async update(id, dto) {
        const sede = await this.findOne(id);
        Object.assign(sede, dto);
        const saved = await this.sedeRepository.save(sede);
        await this.syncAllSedesToVector();
        return saved;
    }
    async remove(id) {
        const sede = await this.findOne(id);
        await this.sedeRepository.remove(sede);
        await this.syncAllSedesToVector();
    }
    async syncAllSedesToVector() {
        const sedes = await this.sedeRepository.find({
            where: { is_active: true },
            order: { id_sede: 'ASC' },
        });
        if (sedes.length === 0)
            return;
        const text = sedes
            .map((s) => {
            const parts = [
                `SEDE: ${s.nombre_sede}`,
                s.direccion ? `Dirección: ${s.direccion}` : '',
                s.telefono ? `Teléfono: ${s.telefono}` : '',
                s.link_map ? `Link de Google Maps: ${s.link_map}` : '',
            ].filter(Boolean);
            return parts.join('\n');
        })
            .join('\n\n---\n\n');
        const fullText = `INFORMACIÓN CONSOLIDADA DE TODAS LAS SEDES DE LA AGENCIA:\n\n${text}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_sedes',
            total_sedes: sedes.length,
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_sedes' })
            .getOne();
        if (existingVector) {
            existingVector.text = fullText;
            existingVector.embedding = embedding;
            existingVector.metadata = metadata;
            existingVector.modifiedTime = new Date();
            await this.n8nVectorRepository.save(existingVector);
        }
        else {
            const newVector = this.n8nVectorRepository.create({
                text: fullText,
                embedding,
                metadata,
                modifiedTime: new Date(),
            });
            await this.n8nVectorRepository.save(newVector);
        }
    }
};
exports.SedesService = SedesService;
exports.SedesService = SedesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sede_entity_1.Sede)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], SedesService);
//# sourceMappingURL=sedes.service.js.map