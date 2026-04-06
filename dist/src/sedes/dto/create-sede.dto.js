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
exports.CreateSedeDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSedeDto {
    nombre_sede;
    direccion;
    telefono;
    link_map;
    is_active;
}
exports.CreateSedeDto = CreateSedeDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre de la sede debe ser una cadena de texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre de la sede es obligatorio' }),
    __metadata("design:type", String)
], CreateSedeDto.prototype, "nombre_sede", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser una cadena de texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La dirección es obligatoria' }),
    __metadata("design:type", String)
], CreateSedeDto.prototype, "direccion", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es obligatorio' }),
    __metadata("design:type", String)
], CreateSedeDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'El link de mapa debe ser una URL válida' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El link de mapa es obligatorio' }),
    __metadata("design:type", String)
], CreateSedeDto.prototype, "link_map", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El estado activo es obligatorio' }),
    __metadata("design:type", Boolean)
], CreateSedeDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-sede.dto.js.map