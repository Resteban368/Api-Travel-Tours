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
exports.Sede = void 0;
const typeorm_1 = require("typeorm");
let Sede = class Sede {
    id_sede;
    nombre_sede;
    direccion;
    telefono;
    link_map;
    is_active;
};
exports.Sede = Sede;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_sede' }),
    __metadata("design:type", Number)
], Sede.prototype, "id_sede", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_sede', type: 'text' }),
    __metadata("design:type", String)
], Sede.prototype, "nombre_sede", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sede.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sede.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'link_map', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sede.prototype, "link_map", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Sede.prototype, "is_active", void 0);
exports.Sede = Sede = __decorate([
    (0, typeorm_1.Entity)('sedes')
], Sede);
//# sourceMappingURL=sede.entity.js.map