import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('tour_bus_agentes')
export class TourBusAgente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tour_id', type: 'integer' })
  tour_id: number;

  @Column({ name: 'bus_layout_id', type: 'integer' })
  bus_layout_id: number;

  // null = configuración a nivel tour | número = configuración por salida (multiples_fechas)
  @Column({ name: 'tour_salida_id', type: 'integer', nullable: true, default: null })
  tour_salida_id: number | null;

  @Column({ name: 'asientos_agentes', type: 'jsonb', default: [] })
  asientos_agentes: string[];

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
