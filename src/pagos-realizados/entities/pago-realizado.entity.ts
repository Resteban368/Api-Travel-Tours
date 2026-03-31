import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('pagos_realizados')
export class PagoRealizado {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id_pago: number;

  @Column({ name: 'chat_id', type: 'text' })
  chat_id: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ name: 'tipo_documento', type: 'text' })
  tipo_documento: string;

  @Column({ name: 'monto', type: 'numeric', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'proveedor_comercio', type: 'text' })
  proveedor_comercio: string;

  @Column({ name: 'nit', type: 'text' })
  nit: string;

  @Column({ name: 'metodo_pago', type: 'text' })
  metodo_pago: string;

  @Column({ name: 'referencia', type: 'text', unique: true })
  referencia: string;

  @Column({ name: 'fecha_documento', type: 'text' })
  fecha_documento: string;

  @Column({ name: 'is_validated', type: 'boolean', default: false })
  is_validated: boolean;

  @Column({ name: 'url_imagen', type: 'text', nullable: true })
  url_imagen: string | null;
}
