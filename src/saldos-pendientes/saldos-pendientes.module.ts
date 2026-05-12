import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { RecordatorioLog } from '../recordatorio-saldo/entities/recordatorio-log.entity';
import { SaldosPendientesService } from './saldos-pendientes.service';
import { SaldosPendientesController } from './saldos-pendientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, PagoRealizado, RecordatorioLog])],
  controllers: [SaldosPendientesController],
  providers: [SaldosPendientesService],
})
export class SaldosPendientesModule {}
