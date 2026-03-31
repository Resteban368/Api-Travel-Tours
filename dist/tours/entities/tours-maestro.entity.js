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
exports.ToursMaestro = void 0;
const typeorm_1 = require("typeorm");
let ToursMaestro = class ToursMaestro {
    id;
    id_tour;
    nombre_tour;
    agencia;
    fecha_inicio;
    fecha_fin;
    precio;
    punto_partida;
    hora_partida;
    llegada;
    url_imagen;
    link_pdf;
    inclusions;
    exclusions;
    itinerary;
    estado;
    es_promocion;
    is_active;
    es_borrador;
    sede_id;
    createdAt;
};
exports.ToursMaestro = ToursMaestro;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ToursMaestro.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_tour', type: 'int', unique: true, nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "id_tour", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_tour', type: 'text' }),
    __metadata("design:type", String)
], ToursMaestro.prototype, "nombre_tour", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agencia', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "agencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'precio',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "precio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'punto_partida', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "punto_partida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_partida', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "hora_partida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'llegada', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "llegada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_imagen', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "url_imagen", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'link_pdf', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "link_pdf", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inclusions', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "inclusions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exclusions', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "exclusions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'itinerary', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "itinerary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ToursMaestro.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_promocion', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ToursMaestro.prototype, "es_promocion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ToursMaestro.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_borrador', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ToursMaestro.prototype, "es_borrador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ToursMaestro.prototype, "sede_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ToursMaestro.prototype, "createdAt", void 0);
exports.ToursMaestro = ToursMaestro = __decorate([
    (0, typeorm_1.Entity)('tours_maestro')
], ToursMaestro);
//# sourceMappingURL=tours-maestro.entity.js.map