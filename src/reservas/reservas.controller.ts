import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Version,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Version('1')
  @Post()
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }
}
