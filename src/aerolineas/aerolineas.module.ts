import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aerolinea } from './entities/aerolinea.entity';
import { AerolineasService } from './aerolineas.service';
import { AerolineasController } from './aerolineas.controller';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([Aerolinea]), AuditoriaGeneralModule],
  controllers: [AerolineasController],
  providers: [AerolineasService],
  exports: [AerolineasService, TypeOrmModule],
})
export class AerolineasModule {}
