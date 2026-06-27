import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { TourPrecio } from './entities/tour-precio.entity';
import { TourPrecioGrupal } from './entities/tour-precio-grupal.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { AuditoriaTour } from './entities/auditoria-tour.entity';
import { TourBusAgente } from './entities/tour-bus-agente.entity';
import { TourSalida } from './entities/tour-salida.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { BusLayout } from '../bus-layouts/entities/bus-layout.entity';
import { AsientoSeleccionado } from '../seleccion-asientos/entities/asiento-seleccionado.entity';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AuditoriaTourService } from './services/auditoria-tour.service';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';
import { SeleccionAsientosModule } from '../seleccion-asientos/seleccion-asientos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToursMaestro, TourPrecio, TourPrecioGrupal, N8nVector, AuditoriaTour, Reserva, PagoRealizado, BusLayout, TourBusAgente, AsientoSeleccionado, TourSalida]),
    EmbeddingsModule,
    AuditoriaGeneralModule,
    SeleccionAsientosModule,
  ],
  controllers: [ToursController],
  providers: [ToursService, AuditoriaTourService],
  exports: [ToursService],
})
export class ToursModule {}
