"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SedesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sede_entity_1 = require("./entities/sede.entity");
const sedes_service_1 = require("./sedes.service");
const sedes_controller_1 = require("./sedes.controller");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
let SedesModule = class SedesModule {
};
exports.SedesModule = SedesModule;
exports.SedesModule = SedesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([sede_entity_1.Sede, n8n_vector_entity_1.N8nVector]), embeddings_module_1.EmbeddingsModule],
        controllers: [sedes_controller_1.SedesController],
        providers: [sedes_service_1.SedesService],
        exports: [sedes_service_1.SedesService],
    })
], SedesModule);
//# sourceMappingURL=sedes.module.js.map