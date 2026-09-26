import { Controller, Get, Param, Req, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { MarcaCotizacion, archivoPublico, hostDe, parseMarcas } from './marcas-cotizacion';

const DEFAULT_TEMPLATE = 'cotizacion-respuesta.html';

@Controller('cotizacion')
@Public()
export class CotizacionPageController {
  /** Dominio → plantilla/logo, desde COTIZACION_TEMPLATES (ver marcas-cotizacion.ts) */
  private readonly marcas: Map<string, MarcaCotizacion>;

  constructor(configService: ConfigService) {
    this.marcas = parseMarcas(configService.get<string>('COTIZACION_TEMPLATES'));
  }

  @Version(VERSION_NEUTRAL)
  @Get(':token')
  servePage(@Param('token') _token: string, @Req() req: Request, @Res() res: Response) {
    const plantilla = archivoPublico(this.marcas.get(hostDe(req))?.plantilla);
    res.sendFile(plantilla ?? archivoPublico(DEFAULT_TEMPLATE)!);
  }
}
