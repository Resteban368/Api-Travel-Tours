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
exports.PagosRealizadosController = void 0;
const common_1 = require("@nestjs/common");
const pagos_realizados_service_1 = require("./pagos-realizados.service");
const create_pago_realizado_dto_1 = require("./dto/create-pago-realizado.dto");
const update_pago_realizado_dto_1 = require("./dto/update-pago-realizado.dto");
let PagosRealizadosController = class PagosRealizadosController {
    pagosService;
    constructor(pagosService) {
        this.pagosService = pagosService;
    }
    create(createDto, req) {
        const realizadoPor = req.user?.nombre || req.user?.email;
        return this.pagosService.create(createDto, realizadoPor);
    }
    findAll(startDate, endDate) {
        return this.pagosService.findAll(startDate, endDate);
    }
    findAuditoria(idPagoRaw, startDate, endDate) {
        const idPago = idPagoRaw ? parseInt(idPagoRaw, 10) : undefined;
        return this.pagosService.findAuditoria(idPago, startDate, endDate);
    }
    findOne(id) {
        return this.pagosService.findOne(id);
    }
    update(id, updateDto, req) {
        const realizadoPor = req.user?.nombre || req.user?.email;
        return this.pagosService.update(id, updateDto, realizadoPor);
    }
    remove(id, req) {
        const realizadoPor = req.user?.nombre || req.user?.email;
        return this.pagosService.remove(id, realizadoPor);
    }
};
exports.PagosRealizadosController = PagosRealizadosController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pago_realizado_dto_1.CreatePagoRealizadoDto, Object]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)('auditoria'),
    __param(0, (0, common_1.Query)('id_pago')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "findAuditoria", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_pago_realizado_dto_1.UpdatePagoRealizadoDto, Object]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "update", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PagosRealizadosController.prototype, "remove", null);
exports.PagosRealizadosController = PagosRealizadosController = __decorate([
    (0, common_1.Controller)('pagos-realizados'),
    __metadata("design:paramtypes", [pagos_realizados_service_1.PagosRealizadosService])
], PagosRealizadosController);
//# sourceMappingURL=pagos-realizados.controller.js.map