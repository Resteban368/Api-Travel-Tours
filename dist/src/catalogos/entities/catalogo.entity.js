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
exports.Catalogo = void 0;
const typeorm_1 = require("typeorm");
let Catalogo = class Catalogo {
    id_catalogo;
    id_sede;
    nombre_catalogo;
    url_archivo;
    activo;
    fecha_creacion;
};
exports.Catalogo = Catalogo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_catalogo' }),
    __metadata("design:type", Number)
], Catalogo.prototype, "id_catalogo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_sede', type: 'integer' }),
    __metadata("design:type", Number)
], Catalogo.prototype, "id_sede", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_catalogo', type: 'text' }),
    __metadata("design:type", String)
], Catalogo.prototype, "nombre_catalogo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_archivo', type: 'text' }),
    __metadata("design:type", String)
], Catalogo.prototype, "url_archivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Catalogo.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Catalogo.prototype, "fecha_creacion", void 0);
exports.Catalogo = Catalogo = __decorate([
    (0, typeorm_1.Entity)('catalogos')
], Catalogo);
//# sourceMappingURL=catalogo.entity.js.map