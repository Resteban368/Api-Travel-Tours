import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { RolesController } from './roles.controller';
import { AgentesController } from './agentes.controller';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [UsuariosController, RolesController, AgentesController],
  providers: [UsuariosService],
  exports: [UsuariosService, TypeOrmModule], // TypeOrmModule exported so AuthModule can use the repo
})
export class UsuariosModule {}
