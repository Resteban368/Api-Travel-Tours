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
exports.UpdateServicioDto = exports.CreateServicioDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreateServicioDto {
    nombre_servicio;
    costo;
    descripcion;
    id_sede;
    activo;
}
exports.CreateServicioDto = CreateServicioDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del servicio debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del servicio es obligatorio' }),
    __metadata("design:type", String)
], CreateServicioDto.prototype, "nombre_servicio", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El costo debe ser un número' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateServicioDto.prototype, "costo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La descripción debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La descripción es obligatoria' }),
    __metadata("design:type", String)
], CreateServicioDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El ID de la sede debe ser un número' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID de la sede es obligatorio' }),
    __metadata("design:type", Number)
], CreateServicioDto.prototype, "id_sede", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El estado activo debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateServicioDto.prototype, "activo", void 0);
class UpdateServicioDto extends (0, mapped_types_1.PartialType)(CreateServicioDto) {
}
exports.UpdateServicioDto = UpdateServicioDto;
//# sourceMappingURL=servicios.dto.js.map