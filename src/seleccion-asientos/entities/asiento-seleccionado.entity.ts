import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type EstadoAsiento = 'confirmado' | 'hold';

@Entity('asientos_seleccionados')
@Unique(['reserva_id', 'numero_asiento'])
export class AsientoSeleccionado {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'reserva_id', type: 'integer' })
  reserva_id: number;

  @Column({ name: 'numero_asiento', type: 'text' })
  numero_asiento: string;

  @Column({ type: 'text', default: 'confirmado' })
  estado: EstadoAsiento;

  @Column({ name: 'hold_expires_at', type: 'timestamptz', nullable: true })
  hold_expires_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
