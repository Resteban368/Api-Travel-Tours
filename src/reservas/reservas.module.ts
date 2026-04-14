import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { AuditoriaReservaService } from './services/auditoria-reserva.service';
import { Reserva } from './entities/reserva.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { AuditoriaReserva } from './entities/auditoria-reserva.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { ClienteApp } from '../clientes/entities/cliente-app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      IntegranteReserva,
      AuditoriaReserva,
      ToursMaestro,
      Servicio,
      PagoRealizado,
      ClienteApp,
    ]),
  ],
  controllers: [ReservasController],
  providers: [ReservasService, AuditoriaReservaService],
  exports: [ReservasService, AuditoriaReservaService],
})
export class ReservasModule {}
