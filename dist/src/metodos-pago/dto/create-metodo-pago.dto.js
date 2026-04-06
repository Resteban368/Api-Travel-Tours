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
exports.CreateMetodoPagoDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMetodoPagoDto {
    nombre_metodo;
    tipo_pago;
    tipo_cuenta;
    numero_metodo;
    titular_cuenta;
    activo;
}
exports.CreateMetodoPagoDto = CreateMetodoPagoDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del método debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del método es obligatorio' }),
    __metadata("design:type", String)
], CreateMetodoPagoDto.prototype, "nombre_metodo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El tipo de pago debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de pago es obligatorio' }),
    __metadata("design:type", String)
], CreateMetodoPagoDto.prototype, "tipo_pago", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El tipo de cuenta debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMetodoPagoDto.prototype, "tipo_cuenta", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El número del método de pago debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El número del método de pago es obligatorio' }),
    __metadata("design:type", String)
], CreateMetodoPagoDto.prototype, "numero_metodo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del titular debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El campo "Titular de la cuenta" es obligatorio' }),
    __metadata("design:type", String)
], CreateMetodoPagoDto.prototype, "titular_cuenta", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El estado activo debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMetodoPagoDto.prototype, "activo", void 0);
//# sourceMappingURL=create-metodo-pago.dto.js.map