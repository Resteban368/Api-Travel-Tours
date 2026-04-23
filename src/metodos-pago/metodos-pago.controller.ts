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
  Req,
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
  create(@Body() createDto: CreateMetodoPagoDto, @Req() req: any) {
    return this.metodosPagoService.create(createDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
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
    @Req() req: any,
  ) {
    return this.metodosPagoService.update(id, updateDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.metodosPagoService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Post('sync-vectors')
  syncVectors() {
    return this.metodosPagoService.syncAllPaymentMethodsToVector();
  }
}
