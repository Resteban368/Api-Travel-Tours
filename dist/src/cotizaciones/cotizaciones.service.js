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
exports.CotizacionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cotizacion_entity_1 = require("./entities/cotizacion.entity");
let CotizacionesService = class CotizacionesService {
    cotizacionRepository;
    constructor(cotizacionRepository) {
        this.cotizacionRepository = cotizacionRepository;
    }
    create(createCotizacionDto) {
        const newCotizacion = this.cotizacionRepository.create(createCotizacionDto);
        return this.cotizacionRepository.save(newCotizacion);
    }
    findAll() {
        return this.cotizacionRepository.find({ order: { created_at: 'DESC' } });
    }
    async findOne(id) {
        const cotizacion = await this.cotizacionRepository.findOne({ where: { id } });
        if (!cotizacion) {
            throw new common_1.NotFoundException(`Cotización con id ${id} no encontrada`);
        }
        return cotizacion;
    }
    async update(id, updateCotizacionDto) {
        const cotizacion = await this.findOne(id);
        const updatedCotizacion = this.cotizacionRepository.merge(cotizacion, updateCotizacionDto);
        return this.cotizacionRepository.save(updatedCotizacion);
    }
    async remove(id) {
        const cotizacion = await this.findOne(id);
        return this.cotizacionRepository.remove(cotizacion);
    }
};
exports.CotizacionesService = CotizacionesService;
exports.CotizacionesService = CotizacionesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cotizacion_entity_1.Cotizacion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CotizacionesService);
//# sourceMappingURL=cotizaciones.service.js.map