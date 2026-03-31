import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('metodos_pago')
export class MetodoPago {
  @PrimaryGeneratedColumn({ name: 'id_metodo_pago' })
  id_metodo_pago: number;

  @Column({ name: 'nombre_metodo', type: 'text' })
  nombre_metodo: string;

  @Column({ name: 'tipo_pago', type: 'text' })
  tipo_pago: string;

  @Column({ name: 'tipo_cuenta', type: 'text', nullable: true })
  tipo_cuenta: string | null;

  @Column({ name: 'numero_metodo', type: 'text' })
  numero_metodo: string;

  @Column({ name: 'titular_cuenta', type: 'text', default: '' })
  titular_cuenta: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;
}
