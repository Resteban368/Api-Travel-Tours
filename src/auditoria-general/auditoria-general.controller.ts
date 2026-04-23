import { Controller, Get, Query, Version } from '@nestjs/common';
import { AuditoriaGeneralService } from './auditoria-general.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('auditoria-general')
@Roles('admin')
export class AuditoriaGeneralController {
  constructor(private readonly auditoriaService: AuditoriaGeneralService) {}

  /**
   * GET /v1/auditoria-general
   * Query params:
   *   - modulo     (opcional) ej: hoteles, reservas, tours
   *   - operacion  (opcional) CREAR | ACTUALIZAR | ELIMINAR
   *   - usuario_id (opcional)
   *   - fecha      (opcional) YYYY-MM-DD — filtra por día
   *   - page       (opcional, default 1)
   *   - limit      (opcional, default 50)
   */
  @Version('1')
  @Get()
  consultar(
    @Query('modulo') modulo?: string,
    @Query('operacion') operacion?: string,
    @Query('usuario_id') usuarioIdRaw?: string,
    @Query('fecha') fecha?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.auditoriaService.consultar({
      modulo,
      operacion,
      usuario_id: usuarioIdRaw ? parseInt(usuarioIdRaw) : undefined,
      fecha,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }
}
