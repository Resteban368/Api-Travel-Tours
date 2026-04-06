"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reservas_service_1 = require("./reservas.service");
const reservas_controller_1 = require("./reservas.controller");
const reserva_entity_1 = require("./entities/reserva.entity");
const integrante_entity_1 = require("./entities/integrante.entity");
const tours_maestro_entity_1 = require("../tours/entities/tours-maestro.entity");
const servicio_entity_1 = require("../servicios/entities/servicio.entity");
let ReservasModule = class ReservasModule {
};
exports.ReservasModule = ReservasModule;
exports.ReservasModule = ReservasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                reserva_entity_1.Reserva,
                integrante_entity_1.IntegranteReserva,
                tours_maestro_entity_1.ToursMaestro,
                servicio_entity_1.Servicio,
            ]),
        ],
        controllers: [reservas_controller_1.ReservasController],
        providers: [reservas_service_1.ReservasService],
        exports: [reservas_service_1.ReservasService],
    })
], ReservasModule);
//# sourceMappingURL=reservas.module.js.map