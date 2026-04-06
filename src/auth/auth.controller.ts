import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Version,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { Public } from './decorators/public.decorator';

import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /** Endpoint público — no requiere token */
  @Public()
  @Version('1')
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Endpoint público — no requiere token */
  @Public()
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

  /** Registro permitido a nivel general */
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
}
