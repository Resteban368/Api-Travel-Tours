import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Version, Query } from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('cotizaciones')
@RequierePermiso('cotizacion')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Version('1')
  @Post()
  create(@Body() createCotizacionDto: CreateCotizacionDto) {
    return this.cotizacionesService.create(createCotizacionDto);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.cotizacionesService.findAll(parseInt(page), parseInt(limit));
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCotizacionDto: UpdateCotizacionDto) {
    return this.cotizacionesService.update(id, updateCotizacionDto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.remove(id);
  }
}
