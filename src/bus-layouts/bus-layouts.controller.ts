import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Version } from '@nestjs/common';
import { BusLayoutsService } from './bus-layouts.service';
import { CreateBusLayoutDto, UpdateBusLayoutDto } from './dto/create-bus-layout.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('bus-layouts')
@RequierePermiso('reservas')
export class BusLayoutsController {
  constructor(private readonly service: BusLayoutsService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateBusLayoutDto) {
    return this.service.create(dto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBusLayoutDto) {
    return this.service.update(id, dto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Version('1')
  @Get(':id/historial')
  findHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.service.findHistorial(id);
  }
}
