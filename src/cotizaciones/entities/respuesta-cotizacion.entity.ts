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

  @Column({ type: 'boolean', default: false })
  anclada: boolean;

  @Column({ name: 'es_publica', type: 'boolean', default: false })
  es_publica: boolean;

  @Column({ name: 'nombre_cliente', type: 'text' })
  nombre_cliente: string;

  @Column({ name: 'telefono_cliente', type: 'text' })
  telefono_cliente: string;

  @Column({ name: 'creado_por_id', type: 'int', nullable: true })
  creado_por_id: number | null;

  @Column({ name: 'creado_por_nombre', type: 'text', nullable: true })
  creado_por_nombre: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
