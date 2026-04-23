import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Cotizacion } from '../cotizaciones/entities/cotizacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PagoRealizado, Reserva, Cotizacion, Usuario])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
