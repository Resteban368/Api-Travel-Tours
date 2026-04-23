import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuditoriaSesion } from './entities/auditoria-sesion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AuditoriaSesion)
    private readonly sesionRepository: Repository<AuditoriaSesion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const usuario = await this.usuariosService.findByEmail(dto.email);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usuariosService.updateUltimoAcceso(usuario.id_usuario);

    // Registrar inicio de sesión
    await this.sesionRepository.save(
      this.sesionRepository.create({
        usuario_id: usuario.id_usuario,
        ip: ip ?? null,
        user_agent: userAgent ?? null,
      }),
    );

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

    // Cerrar la sesión abierta más reciente del usuario
    const sesionAbierta = await this.sesionRepository.findOne({
      where: { usuario_id: userId, fecha_fin: null as any },
      order: { fecha_inicio: 'DESC' },
    });

    if (sesionAbierta) {
      const fechaFin = new Date();
      const duracion = Math.floor(
        (fechaFin.getTime() - sesionAbierta.fecha_inicio.getTime()) / 1000,
      );
      await this.sesionRepository.update(sesionAbierta.id, {
        fecha_fin: fechaFin,
        duracion_segundos: duracion,
      });
    }

    return { message: 'Sesión cerrada correctamente' };
  }

  async historialSesiones(usuarioId: number) {
    const sesiones = await this.sesionRepository.find({
      where: { usuario_id: usuarioId },
      order: { fecha_inicio: 'DESC' },
      take: 50,
    });

    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: usuarioId },
      select: ['id_usuario', 'nombre', 'email', 'rol_nombre', 'activo'],
    });

    return {
      usuario: usuario
        ? { id: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol_nombre, activo: usuario.activo }
        : null,
      total: sesiones.length,
      sesiones,
    };
  }

  async sesionesDelDia(fecha?: string) {
    const dia = fecha ?? new Date().toISOString().split('T')[0];
    const inicio = new Date(`${dia}T00:00:00.000Z`);
    const fin = new Date(`${dia}T23:59:59.999Z`);

    const sesiones = await this.sesionRepository
      .createQueryBuilder('s')
      .where('s.fecha_inicio >= :inicio AND s.fecha_inicio <= :fin', { inicio, fin })
      .orderBy('s.fecha_inicio', 'DESC')
      .getMany();

    // Cargar info de usuarios en batch
    const usuarioIds = [...new Set(sesiones.map((s) => s.usuario_id))];
    const usuarios = usuarioIds.length > 0
      ? await this.usuarioRepository.find({
          where: usuarioIds.map((id) => ({ id_usuario: id })),
          select: ['id_usuario', 'nombre', 'email', 'rol_nombre'],
        })
      : [];

    const usuariosMap = Object.fromEntries(usuarios.map((u) => [u.id_usuario, u]));

    const data = sesiones.map((s) => {
      const u = usuariosMap[s.usuario_id];
      return {
        ...s,
        usuario: u
          ? { id: u.id_usuario, nombre: u.nombre, email: u.email, rol: u.rol_nombre }
          : null,
      };
    });

    return { fecha: dia, total: data.length, sesiones: data };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: number,
    email: string,
    rol: string,
  ) {
    const jwtPayload: JwtPayload = { sub: userId, email, rol };

    // Access token — 2 horas
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '2h',
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
      expires_in: 7200, // segundos (2 horas)
    };
  }
}
