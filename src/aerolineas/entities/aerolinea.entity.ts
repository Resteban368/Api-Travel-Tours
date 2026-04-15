import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('aerolineas')
export class Aerolinea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ name: 'codigo_iata', type: 'text', unique: true })
  codigo_iata: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logo_url: string | null;

  @Column({ type: 'text', nullable: true })
  pais: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
