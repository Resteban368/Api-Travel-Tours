import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Version, Query, Req, DefaultValuePipe } from '@nestjs/common';
import { RespuestasCotizacionService } from './respuestas-cotizacion.service';
import { CreateRespuestaCotizacionDto, UpdateRespuestaCotizacionDto } from './dto/create-respuesta-cotizacion.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('respuestas-cotizacion')
@RequierePermiso('cotizacion')
export class RespuestasCotizacionController {
  constructor(private readonly service: RespuestasCotizacionService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateRespuestaCotizacionDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Post('preview')
  preview(@Body() dto: CreateRespuestaCotizacionDto) {
    return this.service.createPreview(dto);
  }

  @Version('1')
  @Get('plantillas')
  findPlantillas(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Req() req?: any,
  ) {
    return this.service.findPlantillas(req.user?.id_usuario, page, limit);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('sinCotizacion') sinCotizacion?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Req() req?: any,
  ) {
    const isSinCotizacion = sinCotizacion === 'true';
    return this.service.findAll(isSinCotizacion, req.user?.id_usuario, page, limit);
  }

  @Version('1')
  @Get('cotizacion/:cotizacionId')
  findByCotizacion(@Param('cotizacionId', ParseIntPipe) cotizacionId: number) {
    return this.service.findByCotizacion(cotizacionId);
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRespuestaCotizacionDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Patch(':id/anclar')
  toggleAnclada(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.toggleAnclada(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
