import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermisoAgente } from '../entities/permiso-agente.entity';
import { PERMISO_KEY, PermisoMetadata } from '../decorators/requiere-permiso.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(PermisoAgente)
    private readonly permisoRepo: Repository<PermisoAgente>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permiso = this.reflector.getAllAndOverride<PermisoMetadata | undefined>(
      PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin decorador → no aplica este guard
    if (!permiso) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin tiene acceso total
    if (!user || user.rol === 'admin') return true;

    // Dashboard siempre accesible para agentes con nivel completo
    if (permiso.modulo === 'dashboard') return true;

    // Determinar nivel requerido: explícito o auto por método HTTP
    const nivelRequerido =
      permiso.nivel ?? (request.method === 'GET' ? 'lectura' : 'completo');

    const permisoAgente = await this.permisoRepo
      .createQueryBuilder('p')
      .innerJoin('p.modulo', 'm')
      .where('p.usuario_id = :uid', { uid: user.id_usuario })
      .andWhere('m.nombre = :nombre', { nombre: permiso.modulo })
      .andWhere('m.estado = true')
      .select(['p.id', 'p.tipo_permiso'])
      .getOne();

    if (!permisoAgente) {
      throw new ForbiddenException(
        `No tienes acceso al módulo "${permiso.modulo}"`,
      );
    }

    if (nivelRequerido === 'completo' && permisoAgente.tipo_permiso === 'lectura') {
      throw new ForbiddenException(
        `Solo tienes acceso de lectura al módulo "${permiso.modulo}"`,
      );
    }

    return true;
  }
}
