import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaGeneral } from './entities/auditoria-general.entity';
import { AuditoriaGeneralService } from './auditoria-general.service';
import { AuditoriaGeneralController } from './auditoria-general.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaGeneral])],
  controllers: [AuditoriaGeneralController],
  providers: [AuditoriaGeneralService],
  exports: [AuditoriaGeneralService],
})
export class AuditoriaGeneralModule {}
