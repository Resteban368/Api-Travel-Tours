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
import { InfoEmpresaService } from './info-empresa.service';
import { CreateInfoEmpresaDto, UpdateInfoEmpresaDto } from './dto/info-empresa.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';
@Controller('info-empresa')
@RequierePermiso('infoEmpresa')
export class InfoEmpresaController {
  constructor(private readonly infoEmpresaService: InfoEmpresaService) {}

  @Version('1')
  @Post()
  create(@Body() createDto: CreateInfoEmpresaDto) {
    return this.infoEmpresaService.create(createDto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.infoEmpresaService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.infoEmpresaService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInfoEmpresaDto,
  ) {
    return this.infoEmpresaService.update(id, updateDto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.infoEmpresaService.remove(id);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.infoEmpresaService.syncInfoToVector();
  }
}
