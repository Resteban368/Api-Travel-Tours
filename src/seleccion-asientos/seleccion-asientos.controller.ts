import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Version,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SeleccionAsientosService } from './seleccion-asientos.service';
import { VerificarCedulaDto, ConfirmarSeleccionDto, HoldAsientosDto } from './dto/seleccion.dto';

@Controller('seleccion')
@Public()
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class SeleccionAsientosController {
  constructor(private readonly service: SeleccionAsientosService) {}

  @Version('1')
  @Get(':token')
  getInfo(@Param('token') token: string) {
    return this.service.getInfoSeleccion(token);
  }

  @Version('1')
  @Post(':token/verificar-cedula')
  verificarCedula(@Param('token') token: string, @Body() dto: VerificarCedulaDto) {
    return this.service.verificarCedula(token, dto.cedula);
  }

  @Version('1')
  @Post(':token/hold')
  hold(@Param('token') token: string, @Body() dto: HoldAsientosDto) {
    return this.service.holdAsientos(token, dto.asientos);
  }

  @Version('1')
  @Delete(':token/hold')
  releaseHold(@Param('token') token: string) {
    return this.service.releaseHold(token);
  }

  @Version('1')
  @Post(':token/confirmar')
  confirmar(@Param('token') token: string, @Body() dto: ConfirmarSeleccionDto) {
    return this.service.confirmarSeleccion(token, dto.cedula, dto.asientos);
  }
}
