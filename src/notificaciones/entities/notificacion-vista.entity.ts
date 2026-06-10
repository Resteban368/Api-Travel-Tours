import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notificaciones_vistas')
@Index(['usuario_id', 'notificacion_id'], { unique: true })
export class NotificacionVista {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id: number;

  @Column({ name: 'notificacion_id', type: 'int' })
  notificacion_id: number;

  @CreateDateColumn({ name: 'visto_at', type: 'timestamptz' })
  visto_at: Date;
}
