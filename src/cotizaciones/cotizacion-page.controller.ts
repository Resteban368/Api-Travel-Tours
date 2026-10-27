import { Controller, Get, Param, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { MARCA_COTIZACION, archivoPublico } from './marcas-cotizacion';

@Controller('cotizacion')
@Public()
export class CotizacionPageController {
  @Version(VERSION_NEUTRAL)
  @Get(':token')
  servePage(@Param('token') _token: string, @Res() res: Response) {
    res.sendFile(archivoPublico(MARCA_COTIZACION.plantilla)!);
  }
}
