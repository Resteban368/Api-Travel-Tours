import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reserva } from './reserva.entity';
import { Hotel } from '../../hoteles/entities/hotel.entity';

@Entity('hoteles_reserva')
export class HotelReserva {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reserva, (reserva) => reserva.hoteles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva;

  @ManyToOne(() => Hotel, { eager: true, nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'numero_reserva', type: 'text' })
  numero_reserva: string;

  @Column({ name: 'fecha_checkin', type: 'date' })
  fecha_checkin: string;

  @Column({ name: 'fecha_checkout', type: 'date' })
  fecha_checkout: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  valor: number;
}
