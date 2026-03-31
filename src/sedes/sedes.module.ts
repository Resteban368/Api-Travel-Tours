import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sede } from './entities/sede.entity';
import { SedesService } from './sedes.service';
import { SedesController } from './sedes.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { N8nVector } from '../tours/entities/n8n-vector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sede, N8nVector]), EmbeddingsModule],
  controllers: [SedesController],
  providers: [SedesService],
  exports: [SedesService],
})
export class SedesModule {}
