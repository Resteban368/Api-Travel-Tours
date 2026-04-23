import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliticasReservaService } from './politicas-reserva.service';
import { PoliticasReservaController } from './politicas-reserva.controller';
import { PoliticaReserva } from './entities/politica-reserva.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoliticaReserva, N8nVector]),
    EmbeddingsModule,
    AuditoriaGeneralModule,
  ],
  controllers: [PoliticasReservaController],
  providers: [PoliticasReservaService],
  exports: [PoliticasReservaService],
})
export class PoliticasReservaModule {}
