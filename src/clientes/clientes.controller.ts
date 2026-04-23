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
  Version,
  Req,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('clientes')
@RequierePermiso('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateClienteDto, @Req() req: any) {
    return this.clientesService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.clientesService.findAll(parseInt(page), parseInt(limit));
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto, @Req() req: any) {
    return this.clientesService.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.clientesService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
