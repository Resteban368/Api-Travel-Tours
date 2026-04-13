import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('modulos')
export class Modulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  estado: boolean;
}
