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
import { MetodosPagoService } from './metodos-pago.service';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';
@Controller('metodos-pago')
@RequierePermiso('paymentMethods')
export class MetodosPagoController {
  constructor(private readonly metodosPagoService: MetodosPagoService) {}

  @Version('1')
  @Post()
  create(@Body() createDto: CreateMetodoPagoDto) {
    return this.metodosPagoService.create(createDto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.metodosPagoService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metodosPagoService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMetodoPagoDto,
  ) {
    return this.metodosPagoService.update(id, updateDto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.metodosPagoService.remove(id);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.metodosPagoService.syncAllPaymentMethodsToVector();
  }
}
