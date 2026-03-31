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
exports.Usuario = void 0;
const typeorm_1 = require("typeorm");
let Usuario = class Usuario {
    id_usuario;
    nombre;
    email;
    password_hash;
    rol;
    activo;
    refresh_token_hash;
    fecha_creacion;
    ultimo_acceso;
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_usuario' }),
    __metadata("design:type", Number)
], Usuario.prototype, "id_usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'text' }),
    __metadata("design:type", String)
], Usuario.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', type: 'text', unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', type: 'text' }),
    __metadata("design:type", String)
], Usuario.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'rol',
        type: 'text',
        default: 'agente',
    }),
    __metadata("design:type", String)
], Usuario.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activo', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refresh_token_hash', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "refresh_token_hash", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Usuario.prototype, "fecha_creacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "ultimo_acceso", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], Usuario);
//# sourceMappingURL=usuario.entity.js.map