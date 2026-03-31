import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn({ name: 'id_servicio' })
  id_servicio: number;

  @Column({ name: 'nombre_servicio', type: 'text' })
  nombre_servicio: string;

  @Column({
    name: 'costo',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costo: number | null;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'id_sede', type: 'integer' })
  id_sede: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;
}
