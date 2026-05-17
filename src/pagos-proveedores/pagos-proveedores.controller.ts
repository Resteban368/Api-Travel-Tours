import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseIntPipe, Query, Version, Req, DefaultValuePipe,
} from '@nestjs/common';
import { PagosProveedoresService } from './pagos-proveedores.service';
import { CreatePagoProveedorDto, UpdatePagoProveedorDto } from './dto/create-pago-proveedor.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('pagos-proveedores')
@RequierePermiso('pagosProveedores')
export class PagosProveedoresController {
  constructor(private readonly service: PagosProveedoresService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreatePagoProveedorDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('proveedor_id') proveedor_id?: string,
    @Query('tour_id') tour_id?: string,
    @Query('hotel_id') hotel_id?: string,
    @Query('moneda') moneda?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.service.findAll({
      page,
      limit,
      proveedor_id: proveedor_id ? Number(proveedor_id) : undefined,
      tour_id: tour_id ? Number(tour_id) : undefined,
      hotel_id: hotel_id ? Number(hotel_id) : undefined,
      moneda,
      fecha_desde,
      fecha_hasta,
    });
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePagoProveedorDto, @Req() req: any) {
    return this.service.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
