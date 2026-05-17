import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';
import { ToursMaestro } from '../../tours/entities/tours-maestro.entity';
import { Hotel } from '../../hoteles/entities/hotel.entity';
import { MetodoPago } from '../../metodos-pago/entities/metodo-pago.entity';

export type Moneda = 'COP' | 'USD' | 'EUR';

@Entity('pagos_proveedores')
export class PagoProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'proveedor_id', type: 'int' })
  proveedor_id: number;

  @ManyToOne(() => Proveedor, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @Column({ name: 'tour_id', type: 'int', nullable: true })
  tour_id: number | null;

  @ManyToOne(() => ToursMaestro, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tour_id' })
  tour: ToursMaestro | null;

  @Column({ name: 'hotel_id', type: 'int', nullable: true })
  hotel_id: number | null;

  @ManyToOne(() => Hotel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel | null;

  @Column({ type: 'text' })
  concepto: string;

  @Column({
    type: 'numeric', precision: 14, scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number) => (v == null ? null : Number(v)),
    },
  })
  monto: number;

  @Column({ type: 'text', default: 'COP' })
  moneda: Moneda;

  @Column({ name: 'fecha_pago', type: 'date' })
  fecha_pago: string;

  @Column({ name: 'metodo_pago_id', type: 'int', nullable: true })
  metodo_pago_id: number | null;

  @ManyToOne(() => MetodoPago, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'metodo_pago_id' })
  metodo_pago: MetodoPago | null;

  @Column({ name: 'comprobante_url', type: 'text', nullable: true })
  comprobante_url: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'creado_por_id', type: 'int', nullable: true })
  creado_por_id: number | null;

  @Column({ name: 'creado_por_nombre', type: 'text', nullable: true })
  creado_por_nombre: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
