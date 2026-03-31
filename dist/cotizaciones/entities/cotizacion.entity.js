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
exports.Cotizacion = void 0;
const typeorm_1 = require("typeorm");
let Cotizacion = class Cotizacion {
    id;
    chat_id;
    nombre_completo;
    correo_electronico;
    detalles_plan;
    numero_personas;
    estado;
    is_read;
    created_at;
};
exports.Cotizacion = Cotizacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cotizacion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Cotizacion.prototype, "chat_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Cotizacion.prototype, "nombre_completo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Cotizacion.prototype, "correo_electronico", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Cotizacion.prototype, "detalles_plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Cotizacion.prototype, "numero_personas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'pendiente' }),
    __metadata("design:type", String)
], Cotizacion.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_read', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Cotizacion.prototype, "is_read", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Cotizacion.prototype, "created_at", void 0);
exports.Cotizacion = Cotizacion = __decorate([
    (0, typeorm_1.Entity)('cotizaciones')
], Cotizacion);
//# sourceMappingURL=cotizacion.entity.js.map