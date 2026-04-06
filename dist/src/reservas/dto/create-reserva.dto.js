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
exports.CreateReservaDto = exports.IntegranteDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class IntegranteDto {
    nombre;
    telefono;
    fecha_nacimiento;
}
exports.IntegranteDto = IntegranteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IntegranteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IntegranteDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IntegranteDto.prototype, "fecha_nacimiento", void 0);
class CreateReservaDto {
    id_tour;
    correo;
    estado;
    servicios_ids;
    integrantes;
}
exports.CreateReservaDto = CreateReservaDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateReservaDto.prototype, "id_tour", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReservaDto.prototype, "correo", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['al dia', 'pendiente', 'cancelado']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReservaDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateReservaDto.prototype, "servicios_ids", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IntegranteDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateReservaDto.prototype, "integrantes", void 0);
//# sourceMappingURL=create-reserva.dto.js.map