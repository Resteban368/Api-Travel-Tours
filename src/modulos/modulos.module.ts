import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from './entities/modulo.entity';
import { PermisoAgente } from './entities/permiso-agente.entity';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';
import { PermisosGuard } from './guards/permisos.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo, PermisoAgente])],
  controllers: [ModulosController],
  providers: [ModulosService, PermisosGuard],
  exports: [ModulosService, PermisosGuard, TypeOrmModule],
})
export class ModulosModule {}
