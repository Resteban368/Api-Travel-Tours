import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { Reserva } from './entities/reserva.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Servicio } from '../servicios/entities/servicio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      IntegranteReserva,
      ToursMaestro,
      Servicio,
    ]),
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
