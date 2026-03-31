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
exports.CatalogosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const catalogo_entity_1 = require("./entities/catalogo.entity");
let CatalogosService = class CatalogosService {
    catalogosRepository;
    constructor(catalogosRepository) {
        this.catalogosRepository = catalogosRepository;
    }
    async create(createCatalogoDto) {
        const catalogo = this.catalogosRepository.create({
            id_sede: createCatalogoDto.id_sede,
            nombre_catalogo: createCatalogoDto.nombre_catalogo,
            url_archivo: createCatalogoDto.url_archivo,
            activo: createCatalogoDto.activo ?? true,
        });
        return await this.catalogosRepository.save(catalogo);
    }
    async findAll() {
        return await this.catalogosRepository.find({
            order: { id_catalogo: 'DESC' },
        });
    }
    async findOne(id) {
        const catalogo = await this.catalogosRepository.findOne({
            where: { id_catalogo: id },
        });
        if (!catalogo) {
            throw new common_1.NotFoundException(`Catálogo con ID ${id} no encontrado`);
        }
        return catalogo;
    }
    async update(id, updateCatalogoDto) {
        const catalogo = await this.findOne(id);
        if (updateCatalogoDto.id_sede !== undefined)
            catalogo.id_sede = updateCatalogoDto.id_sede;
        if (updateCatalogoDto.nombre_catalogo !== undefined)
            catalogo.nombre_catalogo = updateCatalogoDto.nombre_catalogo;
        if (updateCatalogoDto.url_archivo !== undefined)
            catalogo.url_archivo = updateCatalogoDto.url_archivo;
        if (updateCatalogoDto.activo !== undefined)
            catalogo.activo = updateCatalogoDto.activo;
        return await this.catalogosRepository.save(catalogo);
    }
    async remove(id) {
        const catalogo = await this.findOne(id);
        await this.catalogosRepository.remove(catalogo);
        return { message: `Catálogo con ID ${id} eliminado correctamente` };
    }
};
exports.CatalogosService = CatalogosService;
exports.CatalogosService = CatalogosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(catalogo_entity_1.Catalogo)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CatalogosService);
//# sourceMappingURL=catalogos.service.js.map