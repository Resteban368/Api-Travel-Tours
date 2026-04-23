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
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Version('1')
  @Post()
  @RequierePermiso('sedes')
  create(@Body() dto: CreateSedeDto, @Req() req: any) {
    return this.sedesService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.sedesService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  @RequierePermiso('sedes')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSedeDto, @Req() req: any) {
    return this.sedesService.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  @RequierePermiso('sedes')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.sedesService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Post('sync-vectors')
  @RequierePermiso('sedes')
  syncVectors() {
    return this.sedesService.syncAllSedesToVector();
  }
}
