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
exports.AuditoriaPago = void 0;
const typeorm_1 = require("typeorm");
let AuditoriaPago = class AuditoriaPago {
    id_auditoria;
    id_pago;
    accion;
    campo_modificado;
    valor_anterior;
    valor_nuevo;
    fecha_auditoria;
    realizado_por;
};
exports.AuditoriaPago = AuditoriaPago;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_auditoria' }),
    __metadata("design:type", Number)
], AuditoriaPago.prototype, "id_auditoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_pago', type: 'int' }),
    __metadata("design:type", Number)
], AuditoriaPago.prototype, "id_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accion', type: 'text' }),
    __metadata("design:type", String)
], AuditoriaPago.prototype, "accion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campo_modificado', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditoriaPago.prototype, "campo_modificado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_anterior', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditoriaPago.prototype, "valor_anterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_nuevo', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditoriaPago.prototype, "valor_nuevo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_auditoria', type: 'timestamptz' }),
    __metadata("design:type", Date)
], AuditoriaPago.prototype, "fecha_auditoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'realizado_por', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditoriaPago.prototype, "realizado_por", void 0);
exports.AuditoriaPago = AuditoriaPago = __decorate([
    (0, typeorm_1.Entity)('auditoria_pagos')
], AuditoriaPago);
//# sourceMappingURL=auditoria-pago.entity.js.map