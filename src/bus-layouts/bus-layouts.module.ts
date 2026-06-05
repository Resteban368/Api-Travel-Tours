import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusLayout } from './entities/bus-layout.entity';
import { BusLayoutsService } from './bus-layouts.service';
import { BusLayoutsController } from './bus-layouts.controller';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { AsientoSeleccionado } from '../seleccion-asientos/entities/asiento-seleccionado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusLayout, ToursMaestro, Reserva, AsientoSeleccionado])],
  controllers: [BusLayoutsController],
  providers: [BusLayoutsService],
  exports: [BusLayoutsService],
})
export class BusLayoutsModule {}
