import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Version,
} from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('modulos')
@Roles('admin')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Version('1')
  @Get()
  findAll() {
    return this.modulosService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modulosService.findOne(id);
  }

  @Version('1')
  @Post()
  create(@Body() dto: CreateModuloDto) {
    return this.modulosService.create(dto);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateModuloDto>,
  ) {
    return this.modulosService.update(id, dto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modulosService.remove(id);
  }
}
