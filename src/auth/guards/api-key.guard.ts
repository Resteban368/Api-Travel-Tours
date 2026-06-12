import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'];
    const validKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!validKey) throw new UnauthorizedException('API key no configurada');
    if (!key || key !== validKey) throw new UnauthorizedException('API key inválida');

    return true;
  }
}
