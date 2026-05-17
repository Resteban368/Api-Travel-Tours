import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, Version, Req, DefaultValuePipe } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/create-proveedor.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('proveedores')
@RequierePermiso('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateProveedorDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProveedorDto, @Req() req: any) {
    return this.service.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
