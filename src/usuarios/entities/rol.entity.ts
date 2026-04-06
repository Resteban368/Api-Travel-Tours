import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({ name: 'nombre', type: 'text', unique: true })
  nombre: string; // 'admin' o 'agente'

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;
}
