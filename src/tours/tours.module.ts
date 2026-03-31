import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToursMaestro, N8nVector]),
    EmbeddingsModule,
  ],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService],
})
export class ToursModule {}
