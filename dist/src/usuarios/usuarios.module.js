"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const usuarios_service_1 = require("./usuarios.service");
const usuarios_controller_1 = require("./usuarios.controller");
const roles_controller_1 = require("./roles.controller");
const agentes_controller_1 = require("./agentes.controller");
const usuario_entity_1 = require("./entities/usuario.entity");
const rol_entity_1 = require("./entities/rol.entity");
let UsuariosModule = class UsuariosModule {
};
exports.UsuariosModule = UsuariosModule;
exports.UsuariosModule = UsuariosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([usuario_entity_1.Usuario, rol_entity_1.Rol])],
        controllers: [usuarios_controller_1.UsuariosController, roles_controller_1.RolesController, agentes_controller_1.AgentesController],
        providers: [usuarios_service_1.UsuariosService],
        exports: [usuarios_service_1.UsuariosService, typeorm_1.TypeOrmModule],
    })
], UsuariosModule);
//# sourceMappingURL=usuarios.module.js.map