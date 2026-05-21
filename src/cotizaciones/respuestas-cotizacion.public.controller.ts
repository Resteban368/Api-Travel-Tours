import { Controller, Get, Post, Param, Req, Version, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RespuestasCotizacionService } from './respuestas-cotizacion.service';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

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

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Version('1')
  @Post(':token/vista')
  @HttpCode(204)
  async registrarVista(@Param('token') token: string, @Req() req: Request) {
    const data = await this.service.findByToken(token);
    if (!data || (data as any)._preview) return;
    const id = (data as any).id;
    if (!id) return;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    await this.service.registrarVista(id, ip, userAgent);
  }
}
