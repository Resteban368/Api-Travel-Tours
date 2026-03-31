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
exports.MetodosPagoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const metodo_pago_entity_1 = require("./entities/metodo-pago.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let MetodosPagoService = class MetodosPagoService {
    metodosPagoRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(metodosPagoRepository, n8nVectorRepository, embeddingsService) {
        this.metodosPagoRepository = metodosPagoRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(createDto) {
        const metodo = this.metodosPagoRepository.create(createDto);
        const saved = await this.metodosPagoRepository.save(metodo);
        await this.syncAllPaymentMethodsToVector();
        return saved;
    }
    async findAll() {
        return await this.metodosPagoRepository.find({
            order: { id_metodo_pago: 'DESC' },
        });
    }
    async findOne(id) {
        const metodo = await this.metodosPagoRepository.findOne({
            where: { id_metodo_pago: id },
        });
        if (!metodo) {
            throw new common_1.NotFoundException(`Método de pago con ID ${id} no encontrado`);
        }
        return metodo;
    }
    async update(id, updateDto) {
        const metodo = await this.findOne(id);
        Object.assign(metodo, updateDto);
        const saved = await this.metodosPagoRepository.save(metodo);
        await this.syncAllPaymentMethodsToVector();
        return saved;
    }
    async remove(id) {
        const metodo = await this.findOne(id);
        await this.metodosPagoRepository.remove(metodo);
        await this.syncAllPaymentMethodsToVector();
        return { message: `Método de pago con ID ${id} eliminado correctamente` };
    }
    async syncAllPaymentMethodsToVector() {
        const metodos = await this.metodosPagoRepository.find({
            where: { activo: true },
            order: { nombre_metodo: 'ASC' },
        });
        if (metodos.length === 0)
            return;
        const text = metodos
            .map((m) => {
            const parts = [
                `MÉTODO: ${m.nombre_metodo}`,
                `Tipo de Pago: ${m.tipo_pago}`,
                m.tipo_cuenta ? `Tipo de Cuenta: ${m.tipo_cuenta}` : '',
                `Número/Cuenta: ${m.numero_metodo}`,
                `Titular de la cuenta: ${m.titular_cuenta}`,
            ].filter(Boolean);
            return parts.join('\n');
        })
            .join('\n\n---\n\n');
        const fullText = `INFORMACIÓN CONSOLIDADA DE MÉTODOS DE PAGO PARA RESERVAS:\n\n${text}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_metodos_pago',
            total_metodos: metodos.length,
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", {
            tipo: 'consolidado_metodos_pago',
        })
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
exports.MetodosPagoService = MetodosPagoService;
exports.MetodosPagoService = MetodosPagoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(metodo_pago_entity_1.MetodoPago)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], MetodosPagoService);
//# sourceMappingURL=metodos-pago.service.js.map