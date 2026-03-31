import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Version } from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';

@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Version('1')
  @Post()
  create(@Body() createCotizacionDto: CreateCotizacionDto) {
    return this.cotizacionesService.create(createCotizacionDto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.cotizacionesService.findAll();
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
