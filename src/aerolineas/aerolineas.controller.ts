import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Version,
} from '@nestjs/common';
import { AerolineasService } from './aerolineas.service';
import { CreateAerolineaDto } from './dto/create-aerolinea.dto';
import { UpdateAerolineaDto } from './dto/update-aerolinea.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('aerolineas')
export class AerolineasController {
  constructor(private readonly aerolineasService: AerolineasService) {}

  @Version('1')
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateAerolineaDto) {
    return this.aerolineasService.create(dto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.aerolineasService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aerolineasService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAerolineaDto) {
    return this.aerolineasService.update(id, dto);
  }
}
