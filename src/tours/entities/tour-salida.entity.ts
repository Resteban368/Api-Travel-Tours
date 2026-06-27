import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ToursMaestro } from './tours-maestro.entity';

@Entity('tour_salidas')
export class TourSalida {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ToursMaestro, (t) => t.salidas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: ToursMaestro;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @Column({ type: 'date' })
  fecha_fin: string;

  // null = hereda cupos del tour padre
  @Column({ type: 'int', nullable: true, default: null })
  cupos: number | null;

  @Column({ type: 'text', nullable: true, default: null })
  label: string | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
