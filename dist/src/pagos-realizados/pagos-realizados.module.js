"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagosRealizadosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pagos_realizados_service_1 = require("./pagos-realizados.service");
const pagos_realizados_controller_1 = require("./pagos-realizados.controller");
const pago_realizado_entity_1 = require("./entities/pago-realizado.entity");
const auditoria_pago_entity_1 = require("./entities/auditoria-pago.entity");
let PagosRealizadosModule = class PagosRealizadosModule {
};
exports.PagosRealizadosModule = PagosRealizadosModule;
exports.PagosRealizadosModule = PagosRealizadosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([pago_realizado_entity_1.PagoRealizado, auditoria_pago_entity_1.AuditoriaPago])],
        controllers: [pagos_realizados_controller_1.PagosRealizadosController],
        providers: [pagos_realizados_service_1.PagosRealizadosService],
        exports: [pagos_realizados_service_1.PagosRealizadosService],
    })
], PagosRealizadosModule);
//# sourceMappingURL=pagos-realizados.module.js.map