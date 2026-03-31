import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn({ name: 'id_sede' })
  id_sede: number;

  @Column({ name: 'nombre_sede', type: 'text' })
  nombre_sede: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion: string | null;

  @Column({ name: 'telefono', type: 'text', nullable: true })
  telefono: string | null;

  @Column({ name: 'link_map', type: 'text', nullable: true })
  link_map: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}
