import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reserva } from './reserva.entity';
import { Aerolinea } from '../../aerolineas/entities/aerolinea.entity';

@Entity('vuelos_reserva')
export class VueloReserva {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reserva, (reserva) => reserva.vuelos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva;

  @ManyToOne(() => Aerolinea, { eager: true, nullable: true })
  @JoinColumn({ name: 'aerolinea_id' })
  aerolinea: Aerolinea | null;

  @Column({ name: 'numero_vuelo', type: 'text', nullable: true })
  numero_vuelo: string | null;

  @Column({ type: 'text' })
  origen: string;

  @Column({ type: 'text' })
  destino: string;

  @Column({ name: 'fecha_salida', type: 'date' })
  fecha_salida: string;

  @Column({ name: 'fecha_llegada', type: 'date' })
  fecha_llegada: string;

  @Column({ name: 'hora_salida', type: 'text' })
  hora_salida: string;

  @Column({ name: 'hora_llegada', type: 'text' })
  hora_llegada: string;

  // economy, business, first, premium_economy
  @Column({ type: 'text', default: 'economy' })
  clase: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  precio: number;

  @Column({ name: 'reserva_vuelo', type: 'text', nullable: true })
  reserva_vuelo: string | null;

  // 'ida' | 'vuelta'
  @Column({ name: 'tipo_vuelo', type: 'text', default: 'ida' })
  tipo_vuelo: string;
}
