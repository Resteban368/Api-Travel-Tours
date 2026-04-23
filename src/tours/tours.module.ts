import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { AuditoriaTour } from './entities/auditoria-tour.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AuditoriaTourService } from './services/auditoria-tour.service';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToursMaestro, N8nVector, AuditoriaTour, Reserva, PagoRealizado]),
    EmbeddingsModule,
    AuditoriaGeneralModule,
  ],
  controllers: [ToursController],
  providers: [ToursService, AuditoriaTourService],
  exports: [ToursService],
})
export class ToursModule {}
