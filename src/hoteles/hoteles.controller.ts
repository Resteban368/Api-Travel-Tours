import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Version,
  Req,
} from '@nestjs/common';
import { HotelesService } from './hoteles.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('hoteles')
export class HotelesController {
  constructor(private readonly hotelesService: HotelesService) {}

  @Version('1')
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateHotelDto, @Req() req: any) {
    return this.hotelesService.create(dto, req.user?.id_usuario, req.user?.nombre);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.hotelesService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hotelesService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHotelDto, @Req() req: any) {
    return this.hotelesService.update(id, dto, req.user?.id_usuario, req.user?.nombre);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.hotelesService.remove(id, req.user?.id_usuario, req.user?.nombre);
  }
}
