import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('cotizaciones')
export class Cotizacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  chat_id: string;

  @Column({ type: 'text' })
  nombre_completo: string;

  @Column({ type: 'text', nullable: true })
  correo_electronico: string | null;

  @Column({ type: 'text' })
  detalles_plan: string;

  @Column({ type: 'int' })
  numero_personas: number;

  @Column({ type: 'text', default: 'pendiente' })
  estado: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
