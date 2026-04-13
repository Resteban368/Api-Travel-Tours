import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Modulo } from './modulo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export type TipoPermiso = 'lectura' | 'completo';

@Entity('permisos_agentes')
@Unique(['usuario_id', 'modulo_id'])
export class PermisoAgente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'modulo_id' })
  modulo_id: number;

  @Column({ type: 'text' })
  tipo_permiso: TipoPermiso;

  @ManyToOne(() => Modulo, { eager: true })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;
}
