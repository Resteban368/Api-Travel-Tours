import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicios.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('servicios')
@RequierePermiso('services')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  create(@Body() createDto: CreateServicioDto, @Req() req: any) {
    return this.serviciosService.create(createDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
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
    @Req() req: any,
  ) {
    return this.serviciosService.update(id, updateDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.serviciosService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Post('sync-vectors')
  syncVectors() {
    return this.serviciosService.syncAllServiciosToVector();
  }
}
