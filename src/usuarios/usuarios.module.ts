import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { RolesController } from './roles.controller';
import { AgentesController } from './agentes.controller';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { PermisoAgente } from '../modulos/entities/permiso-agente.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, PermisoAgente, Modulo]), AuditoriaGeneralModule],
  controllers: [UsuariosController, RolesController, AgentesController],
  providers: [UsuariosService],
  exports: [UsuariosService, TypeOrmModule],
})
export class UsuariosModule {}
