import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicios.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('servicios')
@RequierePermiso('services')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  create(@Body() createDto: CreateServicioDto) {
    return this.serviciosService.create(createDto);
  }

  @Get()
  findAll() {
    return this.serviciosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateServicioDto,
  ) {
    return this.serviciosService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }

  @Post('sync-vectors')
  syncVectors() {
    return this.serviciosService.syncAllServiciosToVector();
  }
}
