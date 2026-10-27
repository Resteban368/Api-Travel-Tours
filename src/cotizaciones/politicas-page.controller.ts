import { Controller, Get, NotFoundException, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { MARCA_COTIZACION, archivoPublico } from './marcas-cotizacion';

/** Página pública de políticas de la empresa (diseño Travel Club). */
@Controller('politicas')
@Public()
export class PoliticasPageController {
  @Version(VERSION_NEUTRAL)
  @Get()
  servePage(@Res() res: Response) {
    const pagina = archivoPublico(MARCA_COTIZACION.politicas);
    if (!pagina) throw new NotFoundException('Página de políticas no disponible');
    res.sendFile(pagina);
  }
}
