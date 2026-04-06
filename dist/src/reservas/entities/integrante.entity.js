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
exports.IntegranteReserva = void 0;
const typeorm_1 = require("typeorm");
const reserva_entity_1 = require("./reserva.entity");
let IntegranteReserva = class IntegranteReserva {
    id;
    nombre;
    telefono;
    fecha_nacimiento;
    reserva;
};
exports.IntegranteReserva = IntegranteReserva;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], IntegranteReserva.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], IntegranteReserva.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IntegranteReserva.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], IntegranteReserva.prototype, "fecha_nacimiento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reserva_entity_1.Reserva, (reserva) => reserva.integrantes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'reserva_id' }),
    __metadata("design:type", reserva_entity_1.Reserva)
], IntegranteReserva.prototype, "reserva", void 0);
exports.IntegranteReserva = IntegranteReserva = __decorate([
    (0, typeorm_1.Entity)('integrantes_reservas')
], IntegranteReserva);
//# sourceMappingURL=integrante.entity.js.map