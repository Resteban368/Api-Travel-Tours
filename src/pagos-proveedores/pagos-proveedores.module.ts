import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoProveedor } from './entities/pago-proveedor.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Hotel } from '../hoteles/entities/hotel.entity';
import { MetodoPago } from '../metodos-pago/entities/metodo-pago.entity';
import { PagosProveedoresService } from './pagos-proveedores.service';
import { PagosProveedoresController } from './pagos-proveedores.controller';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoProveedor, Proveedor, ToursMaestro, Hotel, MetodoPago]),
    AuditoriaGeneralModule,
  ],
  controllers: [PagosProveedoresController],
  providers: [PagosProveedoresService],
  exports: [PagosProveedoresService],
})
export class PagosProveedoresModule {}
