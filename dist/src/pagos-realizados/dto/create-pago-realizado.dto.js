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
exports.CreatePagoRealizadoDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePagoRealizadoDto {
    chat_id;
    tipo_documento;
    monto;
    proveedor_comercio;
    nit;
    metodo_pago;
    referencia;
    fecha_documento;
    is_validated;
    url_imagen;
}
exports.CreatePagoRealizadoDto = CreatePagoRealizadoDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El chat_id debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El chat_id es obligatorio' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "chat_id", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El tipo_documento debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo_documento es obligatorio' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "tipo_documento", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El monto debe ser un valor numérico' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El monto es obligatorio' }),
    __metadata("design:type", Number)
], CreatePagoRealizadoDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El proveedor_comercio debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El proveedor_comercio es obligatorio' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "proveedor_comercio", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nit debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nit es obligatorio' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "nit", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El metodo_pago debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El metodo_pago es obligatorio' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "metodo_pago", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La referencia debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La referencia es obligatoria' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "referencia", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La fecha_documento debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La fecha_documento es obligatoria' }),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "fecha_documento", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'is_validated debe ser un valor booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePagoRealizadoDto.prototype, "is_validated", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'url_imagen debe ser una URL válida' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePagoRealizadoDto.prototype, "url_imagen", void 0);
//# sourceMappingURL=create-pago-realizado.dto.js.map