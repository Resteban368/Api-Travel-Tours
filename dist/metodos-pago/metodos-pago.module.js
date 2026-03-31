"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetodosPagoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const metodos_pago_service_1 = require("./metodos-pago.service");
const metodos_pago_controller_1 = require("./metodos-pago.controller");
const metodo_pago_entity_1 = require("./entities/metodo-pago.entity");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const n8n_vector_entity_1 = require("../tours/entities/n8n-vector.entity");
let MetodosPagoModule = class MetodosPagoModule {
};
exports.MetodosPagoModule = MetodosPagoModule;
exports.MetodosPagoModule = MetodosPagoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([metodo_pago_entity_1.MetodoPago, n8n_vector_entity_1.N8nVector]),
            embeddings_module_1.EmbeddingsModule,
        ],
        controllers: [metodos_pago_controller_1.MetodosPagoController],
        providers: [metodos_pago_service_1.MetodosPagoService],
    })
], MetodosPagoModule);
//# sourceMappingURL=metodos-pago.module.js.map