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
exports.Reserva = void 0;
const typeorm_1 = require("typeorm");
const tours_maestro_entity_1 = require("../../tours/entities/tours-maestro.entity");
const servicio_entity_1 = require("../../servicios/entities/servicio.entity");
const integrante_entity_1 = require("./integrante.entity");
let Reserva = class Reserva {
    id;
    id_reserva;
    correo;
    estado;
    fecha_creacion;
    fecha_actualizacion;
    tour;
    servicios;
    integrantes;
};
exports.Reserva = Reserva;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reserva.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], Reserva.prototype, "id_reserva", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Reserva.prototype, "correo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'pendiente' }),
    __metadata("design:type", String)
], Reserva.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Reserva.prototype, "fecha_creacion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Reserva.prototype, "fecha_actualizacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tours_maestro_entity_1.ToursMaestro, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'id_tours' }),
    __metadata("design:type", tours_maestro_entity_1.ToursMaestro)
], Reserva.prototype, "tour", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => servicio_entity_1.Servicio, { eager: true }),
    (0, typeorm_1.JoinTable)({
        name: 'reservas_servicios',
        joinColumn: { name: 'reserva_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'servicio_id', referencedColumnName: 'id_servicio' },
    }),
    __metadata("design:type", Array)
], Reserva.prototype, "servicios", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => integrante_entity_1.IntegranteReserva, (integrante) => integrante.reserva, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Reserva.prototype, "integrantes", void 0);
exports.Reserva = Reserva = __decorate([
    (0, typeorm_1.Entity)('reservas')
], Reserva);
//# sourceMappingURL=reserva.entity.js.map