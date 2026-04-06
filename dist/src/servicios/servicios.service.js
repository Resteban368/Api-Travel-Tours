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
exports.ServiciosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const servicio_entity_1 = require("./entities/servicio.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let ServiciosService = class ServiciosService {
    servicioRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(servicioRepository, n8nVectorRepository, embeddingsService) {
        this.servicioRepository = servicioRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(createDto) {
        const servicio = this.servicioRepository.create(createDto);
        const saved = await this.servicioRepository.save(servicio);
        await this.syncAllServiciosToVector();
        return saved;
    }
    async findAll() {
        return await this.servicioRepository.find({
            order: { id_servicio: 'DESC' },
        });
    }
    async findOne(id) {
        const servicio = await this.servicioRepository.findOne({
            where: { id_servicio: id },
        });
        if (!servicio) {
            throw new common_1.NotFoundException(`Servicio con ID ${id} no encontrado`);
        }
        return servicio;
    }
    async update(id, updateDto) {
        const servicio = await this.findOne(id);
        Object.assign(servicio, updateDto);
        const saved = await this.servicioRepository.save(servicio);
        await this.syncAllServiciosToVector();
        return saved;
    }
    async remove(id) {
        const servicio = await this.findOne(id);
        await this.servicioRepository.remove(servicio);
        await this.syncAllServiciosToVector();
        return { message: `Servicio con ID ${id} eliminado correctamente` };
    }
    async syncAllServiciosToVector() {
        const servicios = await this.servicioRepository.find({
            where: { activo: true },
            order: { id_servicio: 'ASC' },
        });
        if (servicios.length === 0)
            return;
        const text = servicios
            .map((s) => {
            const parts = [
                `SERVICIO: ${s.nombre_servicio}`,
                s.descripcion ? `Descripción: ${s.descripcion}` : '',
                s.costo ? `Costo: $${s.costo}` : 'Costo: No especificado',
                `Sede ID: ${s.id_sede}`,
            ].filter(Boolean);
            return parts.join('\n');
        })
            .join('\n\n---\n\n');
        const fullText = `CATÁLOGO CONSOLIDADO DE SERVICIOS ADICIONALES:\n\n${text}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_servicios',
            total_servicios: servicios.length,
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_servicios' })
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
exports.ServiciosService = ServiciosService;
exports.ServiciosService = ServiciosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(servicio_entity_1.Servicio)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], ServiciosService);
//# sourceMappingURL=servicios.service.js.map