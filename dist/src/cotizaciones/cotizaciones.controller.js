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
exports.CotizacionesController = void 0;
const common_1 = require("@nestjs/common");
const cotizaciones_service_1 = require("./cotizaciones.service");
const create_cotizacion_dto_1 = require("./dto/create-cotizacion.dto");
const update_cotizacion_dto_1 = require("./dto/update-cotizacion.dto");
let CotizacionesController = class CotizacionesController {
    cotizacionesService;
    constructor(cotizacionesService) {
        this.cotizacionesService = cotizacionesService;
    }
    create(createCotizacionDto) {
        return this.cotizacionesService.create(createCotizacionDto);
    }
    findAll() {
        return this.cotizacionesService.findAll();
    }
    findOne(id) {
        return this.cotizacionesService.findOne(id);
    }
    update(id, updateCotizacionDto) {
        return this.cotizacionesService.update(id, updateCotizacionDto);
    }
    remove(id) {
        return this.cotizacionesService.remove(id);
    }
};
exports.CotizacionesController = CotizacionesController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cotizacion_dto_1.CreateCotizacionDto]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_cotizacion_dto_1.UpdateCotizacionDto]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "update", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "remove", null);
exports.CotizacionesController = CotizacionesController = __decorate([
    (0, common_1.Controller)('cotizaciones'),
    __metadata("design:paramtypes", [cotizaciones_service_1.CotizacionesService])
], CotizacionesController);
//# sourceMappingURL=cotizaciones.controller.js.map