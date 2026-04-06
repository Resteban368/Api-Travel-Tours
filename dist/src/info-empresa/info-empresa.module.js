"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoEmpresaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const info_empresa_service_1 = require("./info-empresa.service");
const info_empresa_controller_1 = require("./info-empresa.controller");
const info_empresa_entity_1 = require("./entities/info-empresa.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_module_1 = require("../embeddings/embeddings.module");
let InfoEmpresaModule = class InfoEmpresaModule {
};
exports.InfoEmpresaModule = InfoEmpresaModule;
exports.InfoEmpresaModule = InfoEmpresaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([info_empresa_entity_1.InfoEmpresa, n8n_vector_entity_1.N8nVector]),
            embeddings_module_1.EmbeddingsModule,
        ],
        controllers: [info_empresa_controller_1.InfoEmpresaController],
        providers: [info_empresa_service_1.InfoEmpresaService],
        exports: [info_empresa_service_1.InfoEmpresaService],
    })
], InfoEmpresaModule);
//# sourceMappingURL=info-empresa.module.js.map