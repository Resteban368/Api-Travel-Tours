import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { Cotizacion } from './entities/cotizacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cotizacion])],
  controllers: [CotizacionesController],
  providers: [CotizacionesService]
})
export class CotizacionesModule {}
