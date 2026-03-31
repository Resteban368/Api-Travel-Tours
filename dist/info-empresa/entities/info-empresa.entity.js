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
exports.InfoEmpresa = void 0;
const typeorm_1 = require("typeorm");
let InfoEmpresa = class InfoEmpresa {
    id_info;
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
    fecha_modificacion;
};
exports.InfoEmpresa = InfoEmpresa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_info' }),
    __metadata("design:type", Number)
], InfoEmpresa.prototype, "id_info", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'text' }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_sede_principal', type: 'text' }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "direccion_sede_principal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mision', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "mision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vision', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "vision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'detalles_empresa', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "detalles_empresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horario_presencial', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "horario_presencial", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horario_virtual', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "horario_virtual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'redes_sociales', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfoEmpresa.prototype, "redes_sociales", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_gerente', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "nombre_gerente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correo', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "correo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pagina_web', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfoEmpresa.prototype, "pagina_web", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'fecha_modificacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InfoEmpresa.prototype, "fecha_modificacion", void 0);
exports.InfoEmpresa = InfoEmpresa = __decorate([
    (0, typeorm_1.Entity)('info_empresa')
], InfoEmpresa);
//# sourceMappingURL=info-empresa.entity.js.map