import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ToursMaestro } from './tours-maestro.entity';

@Entity('tour_precios')
export class TourPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ToursMaestro, (tour) => tour.precios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: ToursMaestro;

  @Column({ type: 'text' })
  descripcion: string; // "Adulto", "Niño 2-12 años", "Bebé 0-1 años", etc.

  @Column({ name: 'edad_min', type: 'int', nullable: true })
  edad_min: number | null;

  @Column({ name: 'edad_max', type: 'int', nullable: true })
  edad_max: number | null;

  // null = aplica a todos los puntos de salida del tour
  @Column({ name: 'punto_partida', type: 'text', nullable: true })
  punto_partida: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number) => (v == null ? 0 : Number(v)),
    },
  })
  precio: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
