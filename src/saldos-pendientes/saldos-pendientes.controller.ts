import { Controller, Get, Query, Version } from '@nestjs/common';
import { SaldosPendientesService } from './saldos-pendientes.service';
import { QuerySaldosDto } from './dto/query-saldos.dto';

@Controller('saldos-pendientes')
export class SaldosPendientesController {
  constructor(private readonly service: SaldosPendientesService) {}

  @Version('1')
  @Get()
  findAll(@Query() query: QuerySaldosDto) {
    return this.service.findSaldosPendientes(query);
  }
}
