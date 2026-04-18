import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Version,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PagosRealizadosService } from './pagos-realizados.service';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('pagos-realizados')
@RequierePermiso('pagosRealizados')
export class PagosRealizadosController {
  constructor(private readonly pagosService: PagosRealizadosService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Version('1')
  @Post()
  create(@Body() createDto: CreatePagoRealizadoDto, @Req() req: any) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.create(createDto, realizadoPor);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.pagosService.findAll(startDate, endDate, parseInt(page), parseInt(limit));
  }

  // ─── AUDITORÍA ────────────────────────────────────────────────────────────

  /**
   * GET /v1/pagos-realizados/auditoria
   *
   * Query params:
   *   - id_pago   (optional) — filtrar por ID del pago
   *   - startDate (optional) — fecha inicio (ISO 8601)
   *   - endDate   (optional) — fecha fin    (ISO 8601)
   */
  @Version('1')
  @Get('auditoria')
  findAuditoria(
    @Query('id_pago') idPagoRaw?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const idPago = idPagoRaw ? parseInt(idPagoRaw, 10) : undefined;
    return this.pagosService.findAuditoria(idPago, startDate, endDate);
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findOne(id);
  }

  @Version('1')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { accion: 'validar' | 'rechazar'; motivo_rechazo?: string },
    @Req() req: any,
  ) {
    const { accion, motivo_rechazo } = body;
    if (accion !== 'validar' && accion !== 'rechazar') {
      throw new BadRequestException('accion debe ser "validar" o "rechazar"');
    }
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.cambiarEstado(id, accion, motivo_rechazo, realizadoPor);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoRealizadoDto,
    @Req() req: any,
  ) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.update(id, updateDto, realizadoPor);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.remove(id, realizadoPor);
  }
}
