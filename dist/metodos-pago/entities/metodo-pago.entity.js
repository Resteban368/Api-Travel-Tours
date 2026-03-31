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
exports.MetodoPago = void 0;
const typeorm_1 = require("typeorm");
let MetodoPago = class MetodoPago {
    id_metodo_pago;
    nombre_metodo;
    tipo_pago;
    tipo_cuenta;
    numero_metodo;
    titular_cuenta;
    activo;
    fecha_creacion;
};
exports.MetodoPago = MetodoPago;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_metodo_pago' }),
    __metadata("design:type", Number)
], MetodoPago.prototype, "id_metodo_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_metodo', type: 'text' }),
    __metadata("design:type", String)
], MetodoPago.prototype, "nombre_metodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_pago', type: 'text' }),
    __metadata("design:type", String)
], MetodoPago.prototype, "tipo_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_cuenta', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], MetodoPago.prototype, "tipo_cuenta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_metodo', type: 'text' }),
    __metadata("design:type", String)
], MetodoPago.prototype, "numero_metodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'titular_cuenta', type: 'text', default: '' }),
    __metadata("design:type", String)
], MetodoPago.prototype, "titular_cuenta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], MetodoPago.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], MetodoPago.prototype, "fecha_creacion", void 0);
exports.MetodoPago = MetodoPago = __decorate([
    (0, typeorm_1.Entity)('metodos_pago')
], MetodoPago);
//# sourceMappingURL=metodo-pago.entity.js.map