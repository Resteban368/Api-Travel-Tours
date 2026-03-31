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
exports.CreateCatalogoDto = void 0;
const class_validator_1 = require("class-validator");
class CreateCatalogoDto {
    id_sede;
    nombre_catalogo;
    url_archivo;
    activo;
}
exports.CreateCatalogoDto = CreateCatalogoDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El ID de la sede debe ser un número' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID de la sede es obligatorio' }),
    __metadata("design:type", Number)
], CreateCatalogoDto.prototype, "id_sede", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del catálogo debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del catálogo es obligatorio' }),
    __metadata("design:type", String)
], CreateCatalogoDto.prototype, "nombre_catalogo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La URL del archivo debe ser un texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La URL del archivo es obligatoria' }),
    __metadata("design:type", String)
], CreateCatalogoDto.prototype, "url_archivo", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El estado activo debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCatalogoDto.prototype, "activo", void 0);
//# sourceMappingURL=create-catalogo.dto.js.map