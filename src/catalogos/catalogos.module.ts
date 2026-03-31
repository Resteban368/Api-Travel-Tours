import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosService } from './catalogos.service';
import { CatalogosController } from './catalogos.controller';
import { Catalogo } from './entities/catalogo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Catalogo])],
  controllers: [CatalogosController],
  providers: [CatalogosService],
})
export class CatalogosModule {}
