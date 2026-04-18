import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reserva } from './reserva.entity';
import { TipoDocumento } from '../../common/constants/tipo-documento';

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

  @Column({ type: 'text', nullable: true })
  tipo_documento: TipoDocumento | null;

  @Column({ type: 'text', nullable: true })
  documento: string | null;

  @ManyToOne(() => Reserva, (reserva) => reserva.integrantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva;
}
