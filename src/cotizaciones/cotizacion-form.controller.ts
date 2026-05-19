import { Controller, Post, Get, Body, Param, ParseIntPipe, Version, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SubmitCotizacionFormDto } from './dto/submit-cotizacion-form.dto';
import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('cotizacion-form')
@Public()
export class CotizacionFormController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Version('1')
  @Get('asesor/:id')
  async getAsesor(@Param('id', ParseIntPipe) id: number) {
    const usuario = await this.usuariosService.findById(id);
    if (!usuario || !usuario.activo) {
      throw new HttpException('Asesor no encontrado', HttpStatus.NOT_FOUND);
    }
    return { id_usuario: usuario.id_usuario, nombre: usuario.nombre };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Version('1')
  @Post()
  async submit(@Body() body: SubmitCotizacionFormDto) {
    const webhookUrl = this.configService.get<string>('WEBHOOK_COTIZACION_URL');

    if (!webhookUrl) {
      throw new HttpException('Webhook no configurado', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new HttpException('Error al procesar la solicitud', HttpStatus.BAD_GATEWAY);
    }

    return { ok: true };
  }
}
