import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegracionController } from './integracion.controller';
import { IntegracionService } from './integracion.service';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Faq } from '../faqs/entities/faq.entity';
import { OpinionesModule } from '../opiniones/opiniones.module';

@Module({
  imports: [TypeOrmModule.forFeature([ToursMaestro, Servicio, Faq]), OpinionesModule],
  controllers: [IntegracionController],
  providers: [IntegracionService],
})
export class IntegracionModule {}
