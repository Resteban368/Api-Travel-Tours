import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaSeleccionToken } from './entities/reserva-seleccion-token.entity';
import { AsientoSeleccionado } from './entities/asiento-seleccionado.entity';
import { SeleccionAsientosService } from './seleccion-asientos.service';
import { SeleccionAsientosController } from './seleccion-asientos.controller';
import { SeleccionPageController } from './seleccion-page.controller';
import { Reserva } from '../reservas/entities/reserva.entity';
import { BusLayout } from '../bus-layouts/entities/bus-layout.entity';
import { TourBusAgente } from '../tours/entities/tour-bus-agente.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservaSeleccionToken,
      AsientoSeleccionado,
      Reserva,
      BusLayout,
      TourBusAgente,
    ]),
    WhatsAppModule,
  ],
  controllers: [SeleccionAsientosController, SeleccionPageController],
  providers: [SeleccionAsientosService],
  exports: [SeleccionAsientosService],
})
export class SeleccionAsientosModule {}
