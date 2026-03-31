import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosRealizadosService } from './pagos-realizados.service';
import { PagosRealizadosController } from './pagos-realizados.controller';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PagoRealizado, AuditoriaPago])],
  controllers: [PagosRealizadosController],
  providers: [PagosRealizadosService],
  exports: [PagosRealizadosService],
})
export class PagosRealizadosModule {}
