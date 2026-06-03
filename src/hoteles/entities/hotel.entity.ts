import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hoteles')
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'text' })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  imagenes: string[] | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  habitaciones: HabitacionHotel[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

export interface HabitacionHotel {
  tipo_cama: string;
  cantidad: number;
  precio: number;
  imagenes?: string[];
  servicios?: string[];
  observaciones?: string;
}
