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
exports.MetodosPagoController = void 0;
const common_1 = require("@nestjs/common");
const metodos_pago_service_1 = require("./metodos-pago.service");
const create_metodo_pago_dto_1 = require("./dto/create-metodo-pago.dto");
const update_metodo_pago_dto_1 = require("./dto/update-metodo-pago.dto");
let MetodosPagoController = class MetodosPagoController {
    metodosPagoService;
    constructor(metodosPagoService) {
        this.metodosPagoService = metodosPagoService;
    }
    create(createDto) {
        return this.metodosPagoService.create(createDto);
    }
    findAll() {
        return this.metodosPagoService.findAll();
    }
    findOne(id) {
        return this.metodosPagoService.findOne(id);
    }
    update(id, updateDto) {
        return this.metodosPagoService.update(id, updateDto);
    }
    remove(id) {
        return this.metodosPagoService.remove(id);
    }
    syncVectors() {
        return this.metodosPagoService.syncAllPaymentMethodsToVector();
    }
};
exports.MetodosPagoController = MetodosPagoController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_metodo_pago_dto_1.CreateMetodoPagoDto]),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_metodo_pago_dto_1.UpdateMetodoPagoDto]),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "update", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "remove", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)('sync-vectors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetodosPagoController.prototype, "syncVectors", null);
exports.MetodosPagoController = MetodosPagoController = __decorate([
    (0, common_1.Controller)('metodos-pago'),
    __metadata("design:paramtypes", [metodos_pago_service_1.MetodosPagoService])
], MetodosPagoController);
//# sourceMappingURL=metodos-pago.controller.js.map