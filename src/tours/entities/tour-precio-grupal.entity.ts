import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ToursMaestro } from './tours-maestro.entity';

@Entity('tour_precios_grupales')
export class TourPrecioGrupal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ToursMaestro, (tour) => tour.precios_grupales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: ToursMaestro;

  @Column({ name: 'min_personas', type: 'int' })
  min_personas: number;

  @Column({ name: 'max_personas', type: 'int' })
  max_personas: number;

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

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
