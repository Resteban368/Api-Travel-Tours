import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TipoDocumento } from '../../common/constants/tipo-documento';

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
  tipo_documento: TipoDocumento | null;

  @Column({ type: 'text', nullable: true })
  documento: string | null;

  @Column({ type: 'text', nullable: true })
  correo: string | null;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}
