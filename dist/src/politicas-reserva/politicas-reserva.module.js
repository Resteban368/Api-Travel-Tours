"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliticasReservaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const politicas_reserva_service_1 = require("./politicas-reserva.service");
const politicas_reserva_controller_1 = require("./politicas-reserva.controller");
const politica_reserva_entity_1 = require("./entities/politica-reserva.entity");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
const embeddings_module_1 = require("../embeddings/embeddings.module");
let PoliticasReservaModule = class PoliticasReservaModule {
};
exports.PoliticasReservaModule = PoliticasReservaModule;
exports.PoliticasReservaModule = PoliticasReservaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([politica_reserva_entity_1.PoliticaReserva, n8n_vector_entity_1.N8nVector]),
            embeddings_module_1.EmbeddingsModule,
        ],
        controllers: [politicas_reserva_controller_1.PoliticasReservaController],
        providers: [politicas_reserva_service_1.PoliticasReservaService],
        exports: [politicas_reserva_service_1.PoliticasReservaService],
    })
], PoliticasReservaModule);
//# sourceMappingURL=politicas-reserva.module.js.map