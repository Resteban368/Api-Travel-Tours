import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  Version,
  Req,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { SearchToursDto } from './dto/search-tours.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('tours')
@RequierePermiso('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateTourDto, @Req() req: any) {
    return this.toursService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.toursService.findAll(todos !== 'true');
  }

  @Version('1')
  @Post('search')
  searchByEmbedding(
    @Body() dto: SearchToursDto,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Note: SearchToursDto already uses camelCase property names
    if (dto.embedding.length !== 3072) {
      throw new BadRequestException(
        'embedding debe tener 3072 dimensiones (text-embedding-3-large)',
      );
    }
    return this.toursService.searchByEmbedding(
      dto.embedding,
      Math.min(Math.max(1, limit), 50),
    );
  }

  @Version('1')
  @Get(':id/detalle')
  findDetalle(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findDetalle(id);
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTourDto, @Req() req: any) {
    return this.toursService.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
