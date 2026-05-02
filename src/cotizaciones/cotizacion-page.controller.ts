import { Controller, Get, Param, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { Public } from '../auth/decorators/public.decorator';

@Controller('cotizacion')
@Public()
export class CotizacionPageController {
  @Version(VERSION_NEUTRAL)
  @Get(':token')
  servePage(@Param('token') _token: string, @Res() res: Response) {
    res.sendFile(join(process.cwd(), 'public', 'cotizacion-respuesta.html'));
  }
}
