import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aerolinea } from './entities/aerolinea.entity';
import { AerolineasService } from './aerolineas.service';
import { AerolineasController } from './aerolineas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aerolinea])],
  controllers: [AerolineasController],
  providers: [AerolineasService],
  exports: [AerolineasService, TypeOrmModule],
})
export class AerolineasModule {}
