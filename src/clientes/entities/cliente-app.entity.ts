import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('clientes_app')
export class ClienteApp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  tipo_documento: 'CC' | 'TI' | 'Pasaporte' | 'cedula' | 'pasaporte' | null;

  @Column({ type: 'text', nullable: true })
  documento: string | null;

  @Column({ type: 'text', nullable: true })
  correo: string | null;

  @Column({ type: 'text', default: 'activo' })
  estado: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}
