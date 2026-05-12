import { Body, Controller, Get, Post, Query, Req, Version } from '@nestjs/common';
import { Request } from 'express';
import { RecordatorioSaldoService } from './recordatorio-saldo.service';
import { RecordatorioSaldoDto } from './dto/recordatorio-saldo.dto';

@Controller('recordatorio-saldo')
export class RecordatorioSaldoController {
  constructor(private readonly service: RecordatorioSaldoService) {}

  @Version('1')
  @Post()
  enviar(@Body() dto: RecordatorioSaldoDto, @Req() req: Request) {
    const user = req.user as any;
    return this.service.enviar(dto, { id: user?.id_usuario, nombre: user?.nombre ?? user?.email });
  }

  @Version('1')
  @Get('logs')
  getLogs(
    @Query('page')  page  = '1',
    @Query('limit') limit = '50',
  ) {
    return this.service.getLogs(Number(page), Number(limit));
  }
}
