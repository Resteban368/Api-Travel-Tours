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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagoRealizado = void 0;
const typeorm_1 = require("typeorm");
let PagoRealizado = class PagoRealizado {
    id_pago;
    chat_id;
    fecha_creacion;
    tipo_documento;
    monto;
    proveedor_comercio;
    nit;
    metodo_pago;
    referencia;
    fecha_documento;
    is_validated;
    url_imagen;
};
exports.PagoRealizado = PagoRealizado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_pago' }),
    __metadata("design:type", Number)
], PagoRealizado.prototype, "id_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chat_id', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "chat_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PagoRealizado.prototype, "fecha_creacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_documento', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "tipo_documento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto', type: 'numeric', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PagoRealizado.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proveedor_comercio', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "proveedor_comercio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nit', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "nit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metodo_pago', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "metodo_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referencia', type: 'text', unique: true }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "referencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_documento', type: 'text' }),
    __metadata("design:type", String)
], PagoRealizado.prototype, "fecha_documento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_validated', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PagoRealizado.prototype, "is_validated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_imagen', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PagoRealizado.prototype, "url_imagen", void 0);
exports.PagoRealizado = PagoRealizado = __decorate([
    (0, typeorm_1.Entity)('pagos_realizados')
], PagoRealizado);
//# sourceMappingURL=pago-realizado.entity.js.map