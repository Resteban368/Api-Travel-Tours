import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sede } from '../../sedes/entities/sede.entity';

@Entity('tours_maestro')
export class ToursMaestro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_tour', type: 'int', unique: true, nullable: true })
  id_tour: number | null;

  @Column({ name: 'nombre_tour', type: 'text' })
  nombre_tour: string;

  @Column({ name: 'agencia', type: 'text', nullable: true })
  agencia: string | null;

  @Column({ name: 'fecha_inicio', type: 'timestamptz', nullable: true })
  fecha_inicio: Date | null;

  @Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
  fecha_fin: Date | null;

  @Column({
    name: 'precio',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precio: number | null;

  @Column({ name: 'punto_partida', type: 'text', nullable: true })
  punto_partida: string | null;

  @Column({ name: 'hora_partida', type: 'text', nullable: true })
  hora_partida: string | null;

  @Column({ name: 'llegada', type: 'text', nullable: true })
  llegada: string | null;

  @Column({ name: 'url_imagen', type: 'text', nullable: true })
  url_imagen: string | null;

  @Column({ name: 'link_pdf', type: 'text', nullable: true })
  link_pdf: string | null;

  @Column({ name: 'inclusions', type: 'jsonb', nullable: true })
  inclusions: string[] | null;

  @Column({ name: 'exclusions', type: 'jsonb', nullable: true })
  exclusions: string[] | null;

  @Column({ name: 'itinerary', type: 'jsonb', nullable: true })
  itinerary: any[] | null;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @Column({ name: 'es_promocion', type: 'boolean', default: false })
  es_promocion: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'es_borrador', type: 'boolean', default: false })
  es_borrador: boolean;

  @Column({ name: 'sede_id', type: 'text', nullable: true })
  sede_id: string | null;

  /*
  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'sede_id', referencedColumnName: 'id_sede' })
  sede: Sede;
  */

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
