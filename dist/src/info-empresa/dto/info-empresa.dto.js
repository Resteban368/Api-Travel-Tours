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
exports.UpdateInfoEmpresaDto = exports.CreateInfoEmpresaDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreateInfoEmpresaDto {
    nombre;
    direccion_sede_principal;
    mision;
    vision;
    detalles_empresa;
    horario_presencial;
    horario_virtual;
    redes_sociales;
    nombre_gerente;
    telefono;
    correo;
    pagina_web;
}
exports.CreateInfoEmpresaDto = CreateInfoEmpresaDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre es obligatorio' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La dirección es obligatoria' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La dirección es obligatoria' }),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "direccion_sede_principal", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La misión debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "mision", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La visión debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "vision", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Los detalles de la empresa deben ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "detalles_empresa", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El horario presencial debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "horario_presencial", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El horario virtual debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "horario_virtual", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateInfoEmpresaDto.prototype, "redes_sociales", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del gerente debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "nombre_gerente", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico debe ser válido' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "correo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La página web debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInfoEmpresaDto.prototype, "pagina_web", void 0);
class UpdateInfoEmpresaDto extends (0, mapped_types_1.PartialType)(CreateInfoEmpresaDto) {
}
exports.UpdateInfoEmpresaDto = UpdateInfoEmpresaDto;
//# sourceMappingURL=info-empresa.dto.js.map