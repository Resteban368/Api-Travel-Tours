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
import { CatalogosService } from './catalogos.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('catalogos')
@RequierePermiso('catalogues')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Post()
  create(@Body() createCatalogoDto: CreateCatalogoDto, @Req() req: any) {
    return this.catalogosService.create(createCatalogoDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
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
    @Req() req: any,
  ) {
    return this.catalogosService.update(id, updateCatalogoDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.catalogosService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
