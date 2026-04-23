import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { HotelesController } from './hoteles.controller';
import { HotelesService } from './hoteles.service';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel]), AuditoriaGeneralModule],
  controllers: [HotelesController],
  providers: [HotelesService],
  exports: [HotelesService],
})
export class HotelesModule {}
