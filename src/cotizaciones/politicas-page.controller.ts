import { Controller, Get, NotFoundException, Req, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { MarcaCotizacion, archivoPublico, hostDe, parseMarcas } from './marcas-cotizacion';

/**
 * Página pública de políticas de la empresa.
 * Cada marca la tiene junto a su plantilla de cotización:
 * cotizacion-respuesta-travelclub.html → politicas-travelclub.html
 */
@Controller('politicas')
@Public()
export class PoliticasPageController {
  private readonly marcas: Map<string, MarcaCotizacion>;

  constructor(configService: ConfigService) {
    this.marcas = parseMarcas(configService.get<string>('COTIZACION_TEMPLATES'));
  }

  @Version(VERSION_NEUTRAL)
  @Get()
  servePage(@Req() req: Request, @Res() res: Response) {
    const plantilla = this.marcas.get(hostDe(req))?.plantilla;
    const pagina = archivoPublico(plantilla?.replace('cotizacion-respuesta', 'politicas'));
    if (!pagina) throw new NotFoundException('Página de políticas no disponible');
    res.sendFile(pagina);
  }
}
