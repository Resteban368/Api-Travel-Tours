import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  Version,
  Req,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { CreateTourDto, CreateTourSalidaDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { SearchToursDto } from './dto/search-tours.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  // ─── LECTURA (solo autenticación) ─────────────────────────────────────────

  @Version('1')
  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.toursService.findAll(todos !== 'true');
  }

  @Version('1')
  @Post('search')
  searchByEmbedding(
    @Body() dto: SearchToursDto,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (dto.embedding.length !== 3072) {
      throw new BadRequestException(
        'embedding debe tener 3072 dimensiones (text-embedding-3-large)',
      );
    }
    return this.toursService.searchByEmbedding(dto.embedding, Math.min(Math.max(1, limit), 50));
  }

  @Version('1')
  @Get('historico')
  findHistorico() {
    return this.toursService.findHistorico();
  }

  @Version('1')
  @Get(':id/buses-disponibilidad')
  getBusesDisponibilidad(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.getBusesDisponibilidad(id);
  }

  @Version('1')
  @Get(':id/buses-manifiesto')
  getBusesManifiesto(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.getBusesManifiesto(id);
  }

  @Version('1')
  @Get(':id/detalle')
  findDetalle(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findDetalle(id);
  }

  @Version('1')
  @Get(':id/buses/:busLayoutId/agentes')
  getAsientosAgentes(
    @Param('id', ParseIntPipe) id: number,
    @Param('busLayoutId', ParseIntPipe) busLayoutId: number,
  ) {
    return this.toursService.getAsientosAgentes(id, busLayoutId);
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  // ─── ESCRITURA (requiere permiso tours) ───────────────────────────────────

  @RequierePermiso('tours')
  @Version('1')
  @Post()
  create(@Body() dto: CreateTourDto, @Req() req: any) {
    return this.toursService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/asignar-asiento')
  asignarAsientoAdmin(
    @Param('id', ParseIntPipe) tourId: number,
    @Body() body: { bus_layout_id: number; reserva_id: number; asientos: string[] },
  ) {
    return this.toursService.asignarAsientoAdmin(tourId, body.bus_layout_id, body.reserva_id, body.asientos);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/auto-asignar-asientos')
  autoAsignarAsientos(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.autoAsignarAsientos(id);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/liberar-asiento')
  liberarAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reserva_id: number; numero_asiento: string },
  ) {
    return this.toursService.liberarAsiento(id, body.reserva_id, body.numero_asiento);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/mover-asiento')
  moverAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { bus_layout_id: number; reserva_id_origen: number; asiento_origen: string; asiento_destino: string },
  ) {
    return this.toursService.moverAsiento(
      id,
      body.bus_layout_id,
      body.reserva_id_origen,
      body.asiento_origen,
      body.asiento_destino,
    );
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/duplicar')
  duplicar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.toursService.duplicarTour(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Patch(':id/finalizar')
  finalizar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.toursService.finalizarTour(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTourDto, @Req() req: any) {
    return this.toursService.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  // ─── SALIDAS (múltiples fechas) ───────────────────────────────────────────

  @Version('1')
  @Get(':id/salidas')
  findSalidas(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findSalidas(id);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Post(':id/salidas')
  addSalida(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTourSalidaDto) {
    return this.toursService.addSalida(id, dto);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Patch(':id/salidas/:salidaId')
  updateSalida(
    @Param('id', ParseIntPipe) id: number,
    @Param('salidaId', ParseIntPipe) salidaId: number,
    @Body() dto: Partial<CreateTourSalidaDto> & { is_active?: boolean },
  ) {
    return this.toursService.updateSalida(id, salidaId, dto);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Delete(':id/salidas/:salidaId')
  removeSalida(
    @Param('id', ParseIntPipe) id: number,
    @Param('salidaId', ParseIntPipe) salidaId: number,
  ) {
    return this.toursService.removeSalida(id, salidaId);
  }

  @RequierePermiso('tours')
  @Version('1')
  @Patch(':id/buses/:busLayoutId/agentes')
  setAsientosAgentes(
    @Param('id', ParseIntPipe) id: number,
    @Param('busLayoutId', ParseIntPipe) busLayoutId: number,
    @Body() body: { asientos_agentes: string[] },
  ) {
    return this.toursService.setAsientosAgentes(id, busLayoutId, body.asientos_agentes ?? []);
  }
}
