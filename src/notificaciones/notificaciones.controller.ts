import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesGateway } from './notificaciones.gateway';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly service: NotificacionesService,
    private readonly gateway: NotificacionesGateway,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── SSE STREAM ───────────────────────────────────────────────────────────

  @Public()
  @Sse('stream')
  stream(
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    let payload: { sub: number };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const userId = payload.sub;

    // Headers SSE para proxies y nginx
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Confirmación de conexión con pequeño delay para asegurar que el Subject esté listo
    setTimeout(() => {
      this.gateway.pushToUser(userId, {
        tipo: 'connected',
        mensaje: 'Conectado al servidor de notificaciones',
      });
    }, 100);

    req.on('close', () => {
      this.gateway.removeStream(userId);
    });

    return this.gateway.getStream(userId);
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: any,
    @Query('solo_no_leidas') soloNoLeidas?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    return this.service.findAll(req.user.id_usuario, {
      solo_no_leidas: soloNoLeidas === 'true',
      limite: limite ? parseInt(limite, 10) : 20,
      pagina: pagina ? parseInt(pagina, 10) : 1,
    });
  }

  // ─── CONTEO NO LEÍDAS ────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('no-leidas/count')
  async countNoLeidas(@Req() req: any) {
    const count = await this.service.countNoLeidas(req.user.id_usuario);
    return { count };
  }

  // ─── CREAR ────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNotificacionDto, @Req() req: any) {
    return this.service.crearYEmitir(dto, req.user.id_usuario);
  }

  // ─── MARCAR UNA LEÍDA ────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.marcarLeida(id, req.user.id_usuario);
  }

  // ─── MARCAR TODAS LEÍDAS ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('leer-todas')
  marcarTodasLeidas(@Req() req: any) {
    return this.service.marcarTodasLeidas(req.user.id_usuario);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
