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
import { CatalogosService } from './catalogos.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Post()
  create(@Body() createCatalogoDto: CreateCatalogoDto) {
    return this.catalogosService.create(createCatalogoDto);
  }

  @Get()
  findAll() {
    return this.catalogosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatalogoDto: UpdateCatalogoDto,
  ) {
    return this.catalogosService.update(id, updateCatalogoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.remove(id);
  }
}
