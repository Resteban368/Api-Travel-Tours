import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type TipoProveedor = 'hotel' | 'aerolinea' | 'transporte' | 'seguro' | 'otro';

@Entity('proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  tipo: TipoProveedor;

  @Column({ type: 'text', nullable: true })
  nit: string | null;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  banco: string | null;

  @Column({ name: 'numero_cuenta', type: 'text', nullable: true })
  numero_cuenta: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
