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
  numero_pasajeros: number;

  @Column({ type: 'date', nullable: true })
  fecha_salida: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_regreso: string | null;

  @Column({ type: 'text', nullable: true })
  origen_destino: string | null;

  @Column({ type: 'text', nullable: true })
  edades_menores: string | null;

  @Column({ type: 'text', nullable: true })
  especificaciones: string | null;

  @Column({ type: 'text', default: 'pendiente' })
  estado: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
