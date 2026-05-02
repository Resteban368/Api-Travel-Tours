import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cotizacion } from './cotizacion.entity';

@Entity('respuestas_cotizacion')
export class RespuestaCotizacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  cotizacion_id: number | null;

  @ManyToOne(() => Cotizacion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cotizacion_id' })
  cotizacion: Cotizacion | null;

  @Column({ type: 'uuid', unique: true })
  token: string;

  @Column({ type: 'text' })
  link: string;

  @Column({ type: 'text' })
  titulo_viaje: string;

  @Column({ type: 'jsonb', default: '[]' })
  imagenes_destino: string[];

  @Column({ type: 'jsonb', default: '[]' })
  items_incluidos: string[];

  @Column({ type: 'jsonb', default: '[]' })
  items_no_incluidos: string[];

  @Column({ type: 'jsonb', default: '[]' })
  vuelos: object[];

  @Column({ type: 'jsonb', default: '[]' })
  opciones_hotel: object[];

  @Column({ type: 'jsonb', default: '[]' })
  adicionales: object[];

  @Column({ type: 'text', nullable: true })
  condiciones_generales: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
