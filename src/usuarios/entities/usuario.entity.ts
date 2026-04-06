import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rol } from './rol.entity';

export type UserRole = 'admin' | 'agente';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'nombre', type: 'text' })
  nombre: string;

  @Column({ name: 'email', type: 'text', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  password_hash: string;

  @ManyToOne(() => Rol, { eager: true })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @Column({ name: 'rol_nombre', type: 'text', default: 'agente' })
  rol_nombre: UserRole;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'refresh_token_hash', type: 'text', nullable: true })
  refresh_token_hash: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  ultimo_acceso: Date | null;
}
