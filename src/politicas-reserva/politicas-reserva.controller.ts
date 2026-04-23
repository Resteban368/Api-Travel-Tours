import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Version,
  Req,
} from '@nestjs/common';
import { PoliticasReservaService } from './politicas-reserva.service';
import { CreatePoliticaReservaDto, UpdatePoliticaReservaDto } from './dto/politicas-reserva.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';
@Controller('politicas-reserva')
@RequierePermiso('politicasReserva')
export class PoliticasReservaController {
  constructor(private readonly politicasReservaService: PoliticasReservaService) {}

  @Version('1')
  @Post()
  create(@Body() createDto: CreatePoliticaReservaDto, @Req() req: any) {
    return this.politicasReservaService.create(createDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.politicasReservaService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.politicasReservaService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePoliticaReservaDto,
    @Req() req: any,
  ) {
    return this.politicasReservaService.update(id, updateDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.politicasReservaService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.politicasReservaService.syncAllPoliticasToVector();
  }
}
