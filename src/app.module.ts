import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ToursModule } from './tours/tours.module';
import { SedesModule } from './sedes/sedes.module';
import { DatabaseModule } from './database/database.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { FaqsModule } from './faqs/faqs.module';
import { ServiciosModule } from './servicios/servicios.module';
import { PoliticasReservaModule } from './politicas-reserva/politicas-reserva.module';
import { InfoEmpresaModule } from './info-empresa/info-empresa.module';
import { PagosRealizadosModule } from './pagos-realizados/pagos-realizados.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { ReservasModule } from './reservas/reservas.module';
import { ModulosModule } from './modulos/modulos.module';
import { PermisosGuard } from './modulos/guards/permisos.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    ToursModule,
    SedesModule,
    CatalogosModule,
    MetodosPagoModule,
    FaqsModule,
    ServiciosModule,
    PoliticasReservaModule,
    InfoEmpresaModule,
    PagosRealizadosModule,
    WhatsAppModule,
    CotizacionesModule,
    ReservasModule,
    ModulosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global de autenticación — aplica a todos los endpoints
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Guard global de roles — aplica después del JWT
    { provide: APP_GUARD, useClass: RolesGuard },
    // Guard global de permisos de módulos — aplica después del de roles
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}
