import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { Servicio } from './entities/servicio.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio, N8nVector]), EmbeddingsModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
})
export class ServiciosModule {}
