import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('opiniones')
export class Opinion {
  @PrimaryGeneratedColumn({ name: 'id_opinion' })
  id_opinion: number;

  @Column({ name: 'nombre', type: 'varchar', length: 40 })
  nombre: string;

  @Column({ name: 'plan', type: 'varchar', length: 80, nullable: true })
  plan: string | null;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  @Column({ name: 'estrellas', type: 'smallint', default: 5 })
  estrellas: number;

  @Column({ name: 'aprobada', type: 'boolean', default: false })
  aprobada: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;
}
