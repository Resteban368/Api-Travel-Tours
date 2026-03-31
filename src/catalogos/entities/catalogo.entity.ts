import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sede } from '../../sedes/entities/sede.entity';

@Entity('catalogos')
export class Catalogo {
  @PrimaryGeneratedColumn({ name: 'id_catalogo' })
  id_catalogo: number;

  @Column({ name: 'id_sede', type: 'integer' })
  id_sede: number;

  @Column({ name: 'nombre_catalogo', type: 'text' })
  nombre_catalogo: string;

  @Column({ name: 'url_archivo', type: 'text' })
  url_archivo: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  /*
  @ManyToOne(() => Sede, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;
  */
}
