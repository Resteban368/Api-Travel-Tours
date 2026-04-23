import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ClienteApp } from './entities/cliente-app.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteApp]), AuditoriaGeneralModule],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
