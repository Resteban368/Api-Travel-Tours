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
exports.FaqsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faq_entity_1 = require("./entities/faq.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let FaqsService = class FaqsService {
    faqRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(faqRepository, n8nVectorRepository, embeddingsService) {
        this.faqRepository = faqRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(createDto) {
        const faq = this.faqRepository.create(createDto);
        const saved = await this.faqRepository.save(faq);
        await this.syncAllFaqsToVector();
        return saved;
    }
    async findAll() {
        return await this.faqRepository.find({
            order: { id_faq: 'DESC' },
        });
    }
    async findOne(id) {
        const faq = await this.faqRepository.findOne({
            where: { id_faq: id },
        });
        if (!faq) {
            throw new common_1.NotFoundException(`FAQ con ID ${id} no encontrado`);
        }
        return faq;
    }
    async update(id, updateDto) {
        const faq = await this.findOne(id);
        Object.assign(faq, updateDto);
        const saved = await this.faqRepository.save(faq);
        await this.syncAllFaqsToVector();
        return saved;
    }
    async remove(id) {
        const faq = await this.findOne(id);
        await this.faqRepository.remove(faq);
        await this.syncAllFaqsToVector();
        return { message: `FAQ con ID ${id} eliminado correctamente` };
    }
    async syncAllFaqsToVector() {
        const faqs = await this.faqRepository.find({
            where: { activo: true },
            order: { id_faq: 'ASC' },
        });
        if (faqs.length === 0) {
            return;
        }
        const text = faqs
            .map((f) => {
            return `PREGUNTA: ${f.pregunta}\nRESPUESTA: ${f.respuesta}`;
        })
            .join('\n\n---\n\n');
        const fullText = `BASE DE CONOCIMIENTO - PREGUNTAS FRECUENTES (FAQs):\n\n${text}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_faqs',
            total_faqs: faqs.length,
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_faqs' })
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
exports.FaqsService = FaqsService;
exports.FaqsService = FaqsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(faq_entity_1.Faq)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], FaqsService);
//# sourceMappingURL=faqs.service.js.map