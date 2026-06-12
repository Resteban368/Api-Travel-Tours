import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionVista } from './entities/notificacion-vista.entity';
import { NotificacionesGateway } from './notificaciones.gateway';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PermisoAgente } from '../modulos/entities/permiso-agente.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Notificacion, NotificacionVista, PermisoAgente, Usuario]),
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesGateway, NotificacionesService, ApiKeyGuard],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
