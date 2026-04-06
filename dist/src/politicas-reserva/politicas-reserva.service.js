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
exports.PoliticasReservaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const politica_reserva_entity_1 = require("./entities/politica-reserva.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let PoliticasReservaService = class PoliticasReservaService {
    politicaRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(politicaRepository, n8nVectorRepository, embeddingsService) {
        this.politicaRepository = politicaRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(dto) {
        const politica = this.politicaRepository.create(dto);
        const saved = await this.politicaRepository.save(politica);
        await this.syncAllPoliticasToVector();
        return saved;
    }
    async findAll() {
        return await this.politicaRepository.find({
            order: { tipo_politica: 'ASC', id_politica: 'ASC' },
        });
    }
    async findOne(id) {
        const politica = await this.politicaRepository.findOne({
            where: { id_politica: id },
        });
        if (!politica) {
            throw new common_1.NotFoundException(`Política con ID ${id} no encontrada`);
        }
        return politica;
    }
    async update(id, dto) {
        const politica = await this.findOne(id);
        Object.assign(politica, dto);
        const saved = await this.politicaRepository.save(politica);
        await this.syncAllPoliticasToVector();
        return saved;
    }
    async remove(id) {
        const politica = await this.findOne(id);
        await this.politicaRepository.remove(politica);
        await this.syncAllPoliticasToVector();
        return { message: `Política con ID ${id} eliminada correctamente` };
    }
    async syncAllPoliticasToVector() {
        const politicas = await this.politicaRepository.find({
            where: { activo: true },
            order: { tipo_politica: 'ASC', id_politica: 'ASC' },
        });
        if (politicas.length === 0) {
            return;
        }
        const textSections = politicas.map((p) => {
            return `POLÍTICA DE ${p.tipo_politica.toUpperCase()}: ${p.titulo}\nDESCRIPCIÓN: ${p.descripcion}`;
        });
        const fullText = `INFORMACIÓN CONSOLIDADA DE POLÍTICAS DE RESERVA Y CANCELACIÓN:\n\n${textSections.join('\n\n---\n\n')}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_politicas_reserva',
            total_politicas: politicas.length,
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_politicas_reserva' })
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
exports.PoliticasReservaService = PoliticasReservaService;
exports.PoliticasReservaService = PoliticasReservaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(politica_reserva_entity_1.PoliticaReserva)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], PoliticasReservaService);
//# sourceMappingURL=politicas-reserva.service.js.map