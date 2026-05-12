import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { RecordatorioLog } from './entities/recordatorio-log.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { RecordatorioSaldoService } from './recordatorio-saldo.service';
import { RecordatorioSaldoController } from './recordatorio-saldo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, PagoRealizado, RecordatorioLog]),
    WhatsAppModule,
  ],
  controllers: [RecordatorioSaldoController],
  providers: [RecordatorioSaldoService],
})
export class RecordatorioSaldoModule {}
