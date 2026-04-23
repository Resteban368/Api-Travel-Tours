import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { Cotizacion } from './entities/cotizacion.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cotizacion]), AuditoriaGeneralModule],
  controllers: [CotizacionesController],
  providers: [CotizacionesService]
})
export class CotizacionesModule {}
