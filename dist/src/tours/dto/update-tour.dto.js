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
exports.UpdateTourDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateTourDto {
    id_tour;
    nombre_tour;
    agencia;
    fecha_inicio;
    fecha_fin;
    precio;
    punto_partida;
    hora_partida;
    llegada;
    url_imagen;
    link_pdf;
    inclusions;
    exclusions;
    itinerary;
    estado;
    es_promocion;
    is_active;
    es_borrador;
    sede_id;
}
exports.UpdateTourDto = UpdateTourDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El ID del tour debe ser un número' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID del tour es obligatorio' }),
    __metadata("design:type", Number)
], UpdateTourDto.prototype, "id_tour", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre del tour debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500, {
        message: 'El nombre del tour no puede superar los 500 caracteres',
    }),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "nombre_tour", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La agencia debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "agencia", void 0);
__decorate([
    (0, class_validator_1.IsString)({
        message: 'La fecha de inicio debe ser una cadena de texto válida',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "fecha_inicio", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La fecha de fin debe ser una cadena de texto válida' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "fecha_fin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El precio debe ser un número' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateTourDto.prototype, "precio", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El punto de partida debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "punto_partida", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La hora de partida debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "hora_partida", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La llegada debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "llegada", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La URL de la imagen debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "url_imagen", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El link del PDF debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "link_pdf", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Las inclusiones deben ser un arreglo' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Cada inclusión debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateTourDto.prototype, "inclusions", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Las exclusiones deben ser un arreglo' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Cada exclusión debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateTourDto.prototype, "exclusions", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'El itinerario debe ser un arreglo' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateTourDto.prototype, "itinerary", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El campo estado debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTourDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El campo es_promocion debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTourDto.prototype, "es_promocion", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El campo is_active debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTourDto.prototype, "is_active", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'El campo es_borrador debe ser un booleano' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTourDto.prototype, "es_borrador", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El ID de la sede debe ser un texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTourDto.prototype, "sede_id", void 0);
//# sourceMappingURL=update-tour.dto.js.map