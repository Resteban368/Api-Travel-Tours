import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /** Endpoint público — no requiere token */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @Version('1')
  @Post('login')
  login(@Body() dto: LoginDto, @Request() req: any) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    return this.authService.login(dto, ip, userAgent);
  }

  /** Endpoint público — no requiere token */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 por minuto
  @Version('1')
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  /** Requiere token válido (cualquier rol) */
  @Version('1')
  @Post('logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id_usuario);
  }

  /** Perfil del usuario autenticado */
  @Version('1')
  @Get('me')
  async me(@Request() req: any) {
    // Al usar el servicio nos aseguramos de que el objeto esté sanitizado 
    // y contenga todos los campos actualizados (incluyendo el rol).
    return this.usuariosService.findOne(req.user.id_usuario);
  }

  /** Cambio de contraseña — requiere token válido */
  @Version('1')
  @Patch('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usuariosService.changePassword(
      req.user.id_usuario,
      dto.current_password,
      dto.new_password,
    );
  }

  /** Solo administradores pueden crear nuevos usuarios */
  @Roles('admin')
  @Version('1')
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.usuariosService.create({
      nombre: dto.nombre,
      email: dto.email,
      password: dto.password,
      rol: dto.rol,
    });
  }

  /** Historial de sesiones por usuario — solo admin */
  @Roles('admin')
  @Version('1')
  @Get('sesiones/:usuarioId')
  historialSesiones(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.authService.historialSesiones(usuarioId);
  }

  /** Sesiones de todos los usuarios por día — solo admin */
  @Roles('admin')
  @Version('1')
  @Get('sesiones')
  sesionesDelDia(@Query('fecha') fecha?: string) {
    return this.authService.sesionesDelDia(fecha);
  }
}
