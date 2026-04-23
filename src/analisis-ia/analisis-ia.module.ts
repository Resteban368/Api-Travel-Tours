import { Module } from '@nestjs/common';
import { AnalisisIaController } from './analisis-ia.controller';
import { AnalisisIaService } from './analisis-ia.service';

@Module({
  controllers: [AnalisisIaController],
  providers: [AnalisisIaService],
})
export class AnalisisIaModule {}
