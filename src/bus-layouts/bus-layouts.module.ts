import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusLayout } from './entities/bus-layout.entity';
import { BusLayoutsService } from './bus-layouts.service';
import { BusLayoutsController } from './bus-layouts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusLayout])],
  controllers: [BusLayoutsController],
  providers: [BusLayoutsService],
  exports: [BusLayoutsService],
})
export class BusLayoutsModule {}
