import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('politicas_reserva')
export class PoliticaReserva {
  @PrimaryGeneratedColumn({ name: 'id_politica' })
  id_politica: number;

  @Column({ name: 'titulo', type: 'text' })
  titulo: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'tipo_politica', type: 'text' })
  tipo_politica: string; // e.g., 'reserva', 'cancelacion'

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;
}
