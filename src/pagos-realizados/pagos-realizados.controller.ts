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
export class PagosRealizadosController {
  constructor(private readonly pagosService: PagosRealizadosService) {}

  // ─── LECTURA (solo autenticación) ─────────────────────────────────────────

  @Version('1')
  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('fechaDocDesde') fechaDocDesde?: string,
    @Query('fechaDocHasta') fechaDocHasta?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    return this.pagosService.findAll(startDate, endDate, safePage, safeLimit, search, fechaDocDesde, fechaDocHasta);
  }

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

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findOne(id);
  }

  // ─── ESCRITURA (requiere permiso pagosRealizados) ─────────────────────────

  @RequierePermiso('pagosRealizados')
  @Version('1')
  @Post()
  create(@Body() createDto: CreatePagoRealizadoDto, @Req() req: any) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.create(createDto, realizadoPor, req.user?.id_usuario);
  }

  @RequierePermiso('pagosRealizados')
  @Version('1')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { accion: 'validar' | 'rechazar' | 'resetear'; motivo_rechazo?: string },
    @Req() req: any,
  ) {
    const { accion, motivo_rechazo } = body;
    if (accion !== 'validar' && accion !== 'rechazar' && accion !== 'resetear') {
      throw new BadRequestException('accion debe ser "validar", "rechazar" o "resetear"');
    }
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.cambiarEstado(id, accion, motivo_rechazo, realizadoPor);
  }

  @RequierePermiso('pagosRealizados')
  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoRealizadoDto,
    @Req() req: any,
  ) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.update(id, updateDto, realizadoPor, req.user?.id_usuario);
  }

  @RequierePermiso('pagosRealizados')
  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const realizadoPor = req.user?.nombre || req.user?.email;
    return this.pagosService.remove(id, realizadoPor, req.user?.id_usuario);
  }
}
