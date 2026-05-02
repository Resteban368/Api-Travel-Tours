import { Controller, Get, Param, Version } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RespuestasCotizacionService } from './respuestas-cotizacion.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('p')
@Public()
export class RespuestasPublicController {
  constructor(private readonly service: RespuestasCotizacionService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Version('1')
  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }
}
