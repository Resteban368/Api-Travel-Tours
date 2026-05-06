import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('reserva_seleccion_tokens')
export class ReservaSeleccionToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'reserva_id', type: 'integer' })
  reserva_id: number;

  @Index()
  @Column({ type: 'uuid', unique: true })
  token: string;

  @Column({ type: 'text' })
  link: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
