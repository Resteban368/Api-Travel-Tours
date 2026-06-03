import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Sede } from '../../sedes/entities/sede.entity';

@Entity('pagos_realizados')
export class PagoRealizado {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id_pago: number;

  @Column({ name: 'chat_id', type: 'text', nullable: true })
  chat_id: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ name: 'tipo_documento', type: 'text', nullable: true })
  tipo_documento: string | null;

  @Column({ name: 'monto', type: 'numeric', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago', type: 'text' })
  metodo_pago: string;

  @Column({ name: 'referencia', type: 'text', unique: true })
  referencia: string;

  @Column({ name: 'fecha_documento', type: 'text' })
  fecha_documento: string;

  @Index()
  @Column({ name: 'is_validated', type: 'boolean', default: false })
  is_validated: boolean;

  @Column({ name: 'is_rechazado', type: 'boolean', default: false })
  is_rechazado: boolean;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivo_rechazo: string | null;

  @Column({ name: 'url_imagen', type: 'text', nullable: true })
  url_imagen: string | null;

  @ManyToOne(() => Reserva, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva | null;

  @Index()
  @Column({ name: 'reserva_id', type: 'integer', nullable: true })
  reserva_id: number | null;

  @Column({ name: 'cliente_nombre', type: 'text', nullable: true })
  cliente_nombre: string | null;

  @Column({ name: 'cliente_identificacion', type: 'text', nullable: true })
  cliente_identificacion: string | null;

  @Column({ name: 'concepto', type: 'text', nullable: true })
  concepto: string | null;

  @Column({ name: 'entidad_tipo', type: 'text', nullable: true })
  entidad_tipo: string | null;

  @Column({ name: 'proveedor_id', type: 'integer', nullable: true })
  proveedor_id: number | null;

  @Index()
  @Column({ name: 'sede_id', type: 'integer', nullable: true })
  sede_id: number | null;

  @ManyToOne(() => Sede, { nullable: true, eager: false })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede | null;
}
