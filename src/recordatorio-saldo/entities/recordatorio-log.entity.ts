import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recordatorios_log')
export class RecordatorioLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  reserva_id: number;

  @Column({ type: 'text' })
  id_reserva: string;

  @Column({ type: 'text' })
  responsable_nombre: string;

  @Column({ type: 'text' })
  telefono: string;

  @Column({ type: 'text' })
  tour_nombre: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  saldo_pendiente: number;

  @Column({ type: 'text', default: 'enviado' })
  estado: 'enviado' | 'fallido';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'integer', nullable: true })
  enviado_por_id: number | null;

  @Column({ type: 'text', nullable: true })
  enviado_por_nombre: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_envio: Date;
}
