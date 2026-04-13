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
} from '@nestjs/common';
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('sedes')
@RequierePermiso('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateSedeDto) {
    return this.sedesService.create(dto);
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSedeDto) {
    return this.sedesService.update(id, dto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.remove(id);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.sedesService.syncAllSedesToVector();
  }
}
