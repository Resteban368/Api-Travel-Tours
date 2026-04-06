import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.findByEmail(dto.email);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último acceso
    await this.usuariosService.updateUltimoAcceso(usuario.id_usuario);

    return this.generateTokenPair(usuario.id_usuario, usuario.email, usuario.rol_nombre);
  }

  // ─── REFRESH (rotación) ────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string) {
    // Decodificar el token para saber a qué usuario pertenece
    let payload: { sub: number };
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario || !usuario.activo || !usuario.refresh_token_hash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar que el token coincide con el hash almacenado
    const tokenMatch = await bcrypt.compare(
      rawRefreshToken,
      usuario.refresh_token_hash,
    );
    if (!tokenMatch) {
      // Posible reutilización — invalidar todo
      await this.usuariosService.updateRefreshToken(usuario.id_usuario, null);
      throw new UnauthorizedException(
        'Refresh token ya fue utilizado. Inicia sesión nuevamente.',
      );
    }

    // Rotar: invalidar el anterior y emitir un nuevo par
    return this.generateTokenPair(usuario.id_usuario, usuario.email, usuario.rol_nombre);
  }

  // ─── LOGOUT ────────────────────────────────────────────────────────────────

  async logout(userId: number): Promise<{ message: string }> {
    await this.usuariosService.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: number,
    email: string,
    rol: string,
  ) {
    const jwtPayload: JwtPayload = { sub: userId, email, rol };

    // Access token — 15 minutos
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    // Refresh token — JWT opaco firmado, expira en 7 días
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    // Guardar hash del refresh token en BD
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.usuariosService.updateRefreshToken(userId, refreshHash);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // segundos
    };
  }
}
