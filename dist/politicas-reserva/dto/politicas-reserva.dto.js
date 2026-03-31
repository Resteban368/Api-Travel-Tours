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
exports.UpdatePoliticaReservaDto = exports.CreatePoliticaReservaDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreatePoliticaReservaDto {
    titulo;
    descripcion;
    tipo_politica;
    activo;
}
exports.CreatePoliticaReservaDto = CreatePoliticaReservaDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El título debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El título es obligatorio' }),
    __metadata("design:type", String)
], CreatePoliticaReservaDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La descripción debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La descripción es obligatoria' }),
    __metadata("design:type", String)
], CreatePoliticaReservaDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El tipo de política debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de política es obligatorio' }),
    __metadata("design:type", String)
], CreatePoliticaReservaDto.prototype, "tipo_politica", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El campo activo debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePoliticaReservaDto.prototype, "activo", void 0);
class UpdatePoliticaReservaDto extends (0, mapped_types_1.PartialType)(CreatePoliticaReservaDto) {
}
exports.UpdatePoliticaReservaDto = UpdatePoliticaReservaDto;
//# sourceMappingURL=politicas-reserva.dto.js.map