import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { AuditoriaReservaService } from './services/auditoria-reserva.service';
import { Reserva } from './entities/reserva.entity';
import { IntegranteReserva } from './entities/integrante.entity';
import { VueloReserva } from './entities/vuelo-reserva.entity';
import { HotelReserva } from './entities/hotel-reserva.entity';
import { AuditoriaReserva } from './entities/auditoria-reserva.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { ClienteApp } from '../clientes/entities/cliente-app.entity';
import { Aerolinea } from '../aerolineas/entities/aerolinea.entity';
import { Hotel } from '../hoteles/entities/hotel.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      IntegranteReserva,
      VueloReserva,
      HotelReserva,
      AuditoriaReserva,
      ToursMaestro,
      Servicio,
      PagoRealizado,
      ClienteApp,
      Aerolinea,
      Hotel,
      Usuario,
    ]),
    AuditoriaGeneralModule,
  ],
  controllers: [ReservasController],
  providers: [ReservasService, AuditoriaReservaService],
  exports: [ReservasService, AuditoriaReservaService],
})
export class ReservasModule {}
