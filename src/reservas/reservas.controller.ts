import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Version,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto';
import { UpdateInfoReservaDto } from './dto/update-info-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('reservas')
@RequierePermiso('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Version('1')
  @Post()
  create(@Body() createReservaDto: CreateReservaDto, @Req() req: Request) {
    const user = req.user as any;
    return this.reservasService.create(createReservaDto, user?.email, user?.id_usuario);
  }

  @Version('1')
  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    return this.reservasService.findAll(parseInt(page), parseInt(limit), search);
  }

  @Version('1')
  @Get('cliente/:clienteId')
  historialCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.reservasService.historialCliente(clienteId, user?.rol, user?.id_usuario);
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @Version('1')
  @Get(':id/seleccion-link')
  getSeleccionLink(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.getSeleccionLink(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservaDto: UpdateReservaDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const realizadoPor = user?.nombre || user?.email;
    return this.reservasService.update(id, updateReservaDto, realizadoPor);
  }

  @Version('1')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoReservaDto,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    return this.reservasService.cambiarEstado(id, updateEstadoDto.estado, email);
  }

  @Version('1')
  @Patch(':id/info')
  actualizarInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInfoDto: UpdateInfoReservaDto,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    return this.reservasService.actualizarInfo(id, updateInfoDto, email);
  }

  @Version('1')
  @Get(':id/auditoria')
  obtenerAuditoria(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.obtenerAuditoria(id);
  }

  @Version('1')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    return this.reservasService.remove(id, email);
  }
}
