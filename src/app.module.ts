import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
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
import { AerolineasModule } from './aerolineas/aerolineas.module';
import { ModulosModule } from './modulos/modulos.module';
import { ClientesModule } from './clientes/clientes.module';
import { UploadsModule } from './uploads/uploads.module';
import { PermisosGuard } from './modulos/guards/permisos.guard';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalisisIaModule } from './analisis-ia/analisis-ia.module';
import { HotelesModule } from './hoteles/hoteles.module';
import { AuditoriaGeneralModule } from './auditoria-general/auditoria-general.module';
import { BusLayoutsModule } from './bus-layouts/bus-layouts.module';
import { SeleccionAsientosModule } from './seleccion-asientos/seleccion-asientos.module';
import { SaldosPendientesModule } from './saldos-pendientes/saldos-pendientes.module';
import { RecordatorioSaldoModule } from './recordatorio-saldo/recordatorio-saldo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
          : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: ['req.headers.authorization'],  // oculta el JWT en los logs
      },
    }),
    CacheModule.register({ isGlobal: true, max: 200 }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,  // ventana de 60 segundos
        limit: 60,   // máx 60 requests por IP (1 por segundo en promedio)
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        retryAttempts: 5,
        retryDelay: 2000,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
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
    AerolineasModule,
    ClientesModule,
    UploadsModule,
    ModulosModule,
    AnalyticsModule,
    AnalisisIaModule,
    HotelesModule,
    AuditoriaGeneralModule,
    BusLayoutsModule,
    SeleccionAsientosModule,
    SaldosPendientesModule,
    RecordatorioSaldoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global de rate limiting — aplica antes de autenticación
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Guard global de autenticación — aplica a todos los endpoints
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Guard global de roles — aplica después del JWT
    { provide: APP_GUARD, useClass: RolesGuard },
    // Guard global de permisos de módulos — aplica después del de roles
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}
