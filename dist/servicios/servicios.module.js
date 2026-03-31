"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiciosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const servicios_service_1 = require("./servicios.service");
const servicios_controller_1 = require("./servicios.controller");
const servicio_entity_1 = require("./entities/servicio.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_module_1 = require("../embeddings/embeddings.module");
let ServiciosModule = class ServiciosModule {
};
exports.ServiciosModule = ServiciosModule;
exports.ServiciosModule = ServiciosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([servicio_entity_1.Servicio, n8n_vector_entity_1.N8nVector]), embeddings_module_1.EmbeddingsModule],
        controllers: [servicios_controller_1.ServiciosController],
        providers: [servicios_service_1.ServiciosService],
    })
], ServiciosModule);
//# sourceMappingURL=servicios.module.js.map