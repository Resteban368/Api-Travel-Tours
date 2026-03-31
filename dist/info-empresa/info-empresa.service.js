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
exports.InfoEmpresaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const info_empresa_entity_1 = require("./entities/info-empresa.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let InfoEmpresaService = class InfoEmpresaService {
    infoRepository;
    n8nVectorRepository;
    embeddingsService;
    constructor(infoRepository, n8nVectorRepository, embeddingsService) {
        this.infoRepository = infoRepository;
        this.n8nVectorRepository = n8nVectorRepository;
        this.embeddingsService = embeddingsService;
    }
    async create(dto) {
        const count = await this.infoRepository.count();
        if (count > 0) {
            throw new common_1.BadRequestException('Ya existe un registro de información de la empresa. Use PATCH para actualizar el registro existente.');
        }
        const info = this.infoRepository.create(dto);
        const saved = await this.infoRepository.save(info);
        await this.syncInfoToVector();
        return saved;
    }
    async findAll() {
        return await this.infoRepository.find();
    }
    async findOne(id) {
        const info = await this.infoRepository.findOne({
            where: { id_info: id },
        });
        if (!info) {
            throw new common_1.NotFoundException(`Información con ID ${id} no encontrada`);
        }
        return info;
    }
    async update(id, dto) {
        const info = await this.findOne(id);
        Object.assign(info, dto);
        const saved = await this.infoRepository.save(info);
        await this.syncInfoToVector();
        return saved;
    }
    async remove(id) {
        const info = await this.findOne(id);
        await this.infoRepository.remove(info);
        await this.syncInfoToVector();
        return { message: `Información con ID ${id} eliminada` };
    }
    async syncInfoToVector() {
        const infos = await this.infoRepository.find();
        if (infos.length === 0)
            return;
        const info = infos[0];
        const socialMedia = Array.isArray(info.redes_sociales)
            ? info.redes_sociales.map((rs) => `${rs.name}: ${rs.link}`).join(', ')
            : '';
        const text = [
            `INFORMACIÓN CORPORATIVA: ${info.nombre}`,
            `Sede Principal: ${info.direccion_sede_principal}`,
            info.mision ? `Misión: ${info.mision}` : '',
            info.vision ? `Visión: ${info.vision}` : '',
            info.detalles_empresa ? `Sobre nosotros: ${info.detalles_empresa}` : '',
            info.horario_presencial ? `Horario Presencial: ${info.horario_presencial}` : '',
            info.horario_virtual ? `Horario Virtual: ${info.horario_virtual}` : '',
            socialMedia ? `Redes Sociales: ${socialMedia}` : '',
            info.nombre_gerente ? `Gerente: ${info.nombre_gerente}` : '',
            info.telefono ? `Teléfono: ${info.telefono}` : '',
            info.correo ? `Correo electrónico: ${info.correo}` : '',
            info.pagina_web ? `Sitio Web: ${info.pagina_web}` : '',
        ].filter(Boolean).join('\n');
        const fullText = `PERFIL COMPLETO DE LA EMPRESA:\n\n${text}`;
        const embedding = await this.embeddingsService.embed(fullText);
        const metadata = {
            tipo: 'consolidado_info_empresa',
            fecha_modificacion: new Date().toISOString(),
        };
        const existingVector = await this.n8nVectorRepository
            .createQueryBuilder('v')
            .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_info_empresa' })
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
exports.InfoEmpresaService = InfoEmpresaService;
exports.InfoEmpresaService = InfoEmpresaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(info_empresa_entity_1.InfoEmpresa)),
    __param(1, (0, typeorm_1.InjectRepository)(n8n_vector_entity_1.N8nVector)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        embeddings_service_1.EmbeddingsService])
], InfoEmpresaService);
//# sourceMappingURL=info-empresa.service.js.map