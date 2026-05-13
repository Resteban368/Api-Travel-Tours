import { Controller, Get, Param, Query, Version } from '@nestjs/common';
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

  @Version('1')
  @Get(':tourId/reservas')
  findReservasByTour(
    @Param('tourId') tourId: string,
    @Query() query: QuerySaldosDto,
  ) {
    return this.service.findReservasPorTour(+tourId, query);
  }
}
