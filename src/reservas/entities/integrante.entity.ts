import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reserva } from './reserva.entity';

@Entity('integrantes_reservas')
export class IntegranteReserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string | null;

  @ManyToOne(() => Reserva, (reserva) => reserva.integrantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva;
}
