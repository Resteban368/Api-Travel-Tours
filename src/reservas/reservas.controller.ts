import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Version,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto';
import { UpdateInfoReservaDto } from './dto/update-info-reserva.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('reservas')
@RequierePermiso('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Version('1')
  @Post()
  create(@Body() createReservaDto: CreateReservaDto, @Req() req: Request) {
    const email = (req.user as any)?.email;
    return this.reservasService.create(createReservaDto, email);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
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
}
