import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { Cotizacion } from './entities/cotizacion.entity';
import { RespuestaCotizacion } from './entities/respuesta-cotizacion.entity';
import { RespuestasCotizacionController } from './respuestas-cotizacion.controller';
import { RespuestasPublicController } from './respuestas-cotizacion.public.controller';
import { CotizacionPageController } from './cotizacion-page.controller';
import { CotizacionFormController } from './cotizacion-form.controller';
import { RespuestasCotizacionService } from './respuestas-cotizacion.service';
import { CotizacionPdfService } from './cotizacion-pdf.service';
import { Aerolinea } from '../aerolineas/entities/aerolinea.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CotizacionRespuestaVista } from './entities/cotizacion-respuesta-vista.entity';
import { InfoEmpresaModule } from '../info-empresa/info-empresa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion, RespuestaCotizacion, Aerolinea, CotizacionRespuestaVista]),
    AuditoriaGeneralModule,
    UsuariosModule,
    InfoEmpresaModule,
  ],
  controllers: [
    CotizacionesController,
    RespuestasCotizacionController,
    RespuestasPublicController,
    CotizacionPageController,
    CotizacionFormController,
  ],
  providers: [CotizacionesService, RespuestasCotizacionService, CotizacionPdfService],
})
export class CotizacionesModule {}
