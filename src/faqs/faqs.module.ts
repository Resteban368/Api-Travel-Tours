import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { Faq } from './entities/faq.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Faq, N8nVector]), EmbeddingsModule],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
