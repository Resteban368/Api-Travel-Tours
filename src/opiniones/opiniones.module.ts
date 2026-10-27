import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionesService } from './opiniones.service';
import { OpinionesController } from './opiniones.controller';
import { Opinion } from './entities/opinion.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion]), AuditoriaGeneralModule],
  controllers: [OpinionesController],
  providers: [OpinionesService],
  exports: [OpinionesService],
})
export class OpinionesModule {}
