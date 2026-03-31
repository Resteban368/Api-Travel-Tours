import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetodosPagoService } from './metodos-pago.service';
import { MetodosPagoController } from './metodos-pago.controller';
import { MetodoPago } from './entities/metodo-pago.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { N8nVector } from '../tours/entities/n8n-vector.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetodoPago, N8nVector]),
    EmbeddingsModule,
  ],
  controllers: [MetodosPagoController],
  providers: [MetodosPagoService],
})
export class MetodosPagoModule {}
