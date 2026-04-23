import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosRealizadosService } from './pagos-realizados.service';
import { PagosRealizadosController } from './pagos-realizados.controller';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([PagoRealizado, AuditoriaPago, Reserva]), AuditoriaGeneralModule],
  controllers: [PagosRealizadosController],
  providers: [PagosRealizadosService],
  exports: [PagosRealizadosService],
})
export class PagosRealizadosModule {}
