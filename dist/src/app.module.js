"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const tours_module_1 = require("./tours/tours.module");
const sedes_module_1 = require("./sedes/sedes.module");
const database_module_1 = require("./database/database.module");
const catalogos_module_1 = require("./catalogos/catalogos.module");
const metodos_pago_module_1 = require("./metodos-pago/metodos-pago.module");
const faqs_module_1 = require("./faqs/faqs.module");
const servicios_module_1 = require("./servicios/servicios.module");
const politicas_reserva_module_1 = require("./politicas-reserva/politicas-reserva.module");
const info_empresa_module_1 = require("./info-empresa/info-empresa.module");
const pagos_realizados_module_1 = require("./pagos-realizados/pagos-realizados.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const auth_module_1 = require("./auth/auth.module");
const usuarios_module_1 = require("./usuarios/usuarios.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./auth/guards/roles.guard");
const cotizaciones_module_1 = require("./cotizaciones/cotizaciones.module");
const reservas_module_1 = require("./reservas/reservas.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    url: configService.get('DATABASE_URL'),
                    autoLoadEntities: true,
                    synchronize: true,
                }),
                inject: [config_1.ConfigService],
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            usuarios_module_1.UsuariosModule,
            tours_module_1.ToursModule,
            sedes_module_1.SedesModule,
            catalogos_module_1.CatalogosModule,
            metodos_pago_module_1.MetodosPagoModule,
            faqs_module_1.FaqsModule,
            servicios_module_1.ServiciosModule,
            politicas_reserva_module_1.PoliticasReservaModule,
            info_empresa_module_1.InfoEmpresaModule,
            pagos_realizados_module_1.PagosRealizadosModule,
            whatsapp_module_1.WhatsAppModule,
            cotizaciones_module_1.CotizacionesModule,
            reservas_module_1.ReservasModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map