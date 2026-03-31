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
import { PoliticasReservaService } from './politicas-reserva.service';
import { CreatePoliticaReservaDto, UpdatePoliticaReservaDto } from './dto/politicas-reserva.dto';
@Controller('politicas-reserva')
export class PoliticasReservaController {
  constructor(private readonly politicasReservaService: PoliticasReservaService) {}

  @Version('1')
  @Post()
  create(@Body() createDto: CreatePoliticaReservaDto) {
    return this.politicasReservaService.create(createDto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.politicasReservaService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.politicasReservaService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePoliticaReservaDto,
  ) {
    return this.politicasReservaService.update(id, updateDto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.politicasReservaService.remove(id);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.politicasReservaService.syncAllPoliticasToVector();
  }
}
