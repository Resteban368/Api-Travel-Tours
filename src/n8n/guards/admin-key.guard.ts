import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-admin-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    const expected = this.config.get<string>('ADMIN_SECRET');

    if (!expected) throw new UnauthorizedException('ADMIN_SECRET no configurado en el servidor');
    if (!key || key !== expected) throw new UnauthorizedException('x-admin-key inválido o ausente');

    return true;
  }
}
