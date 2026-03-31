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
exports.Servicio = void 0;
const typeorm_1 = require("typeorm");
let Servicio = class Servicio {
    id_servicio;
    nombre_servicio;
    costo;
    descripcion;
    id_sede;
    activo;
    fecha_creacion;
};
exports.Servicio = Servicio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_servicio' }),
    __metadata("design:type", Number)
], Servicio.prototype, "id_servicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_servicio', type: 'text' }),
    __metadata("design:type", String)
], Servicio.prototype, "nombre_servicio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'costo',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Servicio.prototype, "costo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Servicio.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_sede', type: 'integer' }),
    __metadata("design:type", Number)
], Servicio.prototype, "id_sede", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Servicio.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Servicio.prototype, "fecha_creacion", void 0);
exports.Servicio = Servicio = __decorate([
    (0, typeorm_1.Entity)('servicios')
], Servicio);
//# sourceMappingURL=servicio.entity.js.map