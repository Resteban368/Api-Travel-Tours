import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sede } from '../../sedes/entities/sede.entity';
import { TourPrecio } from './tour-precio.entity';
import { TourPrecioGrupal } from './tour-precio-grupal.entity';
import { BusLayout } from '../../bus-layouts/entities/bus-layout.entity';
import { TourSalida } from './tour-salida.entity';

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

  @Column({ name: 'precio_por_pareja', type: 'boolean', default: false })
  precio_por_pareja: boolean;

  @Column({ name: 'punto_partida', type: 'text', nullable: true })
  punto_partida: string | null;

  @Column({ name: 'hora_partida', type: 'text', nullable: true })
  hora_partida: string | null;

  @Column({ name: 'llegada', type: 'text', nullable: true })
  llegada: string | null;

  @Column({ name: 'url_imagen', type: 'text', nullable: true })
  url_imagen: string | null;

  @Column({ name: 'imagenes', type: 'jsonb', nullable: true, default: null })
  imagenes: string[] | null;

  @Column({ name: 'link_pdf', type: 'text', nullable: true })
  link_pdf: string | null;

  @Column({ name: 'inclusions', type: 'jsonb', nullable: true })
  inclusions: string[] | null;

  @Column({ name: 'exclusions', type: 'jsonb', nullable: true })
  exclusions: string[] | null;

  @Column({ name: 'itinerary', type: 'jsonb', nullable: true })
  itinerary: any[] | null;

  @Column({ name: 'descripcion', type: 'text', nullable: true, default: null })
  descripcion: string | null;

  @Column({ name: 'recomendaciones', type: 'text', nullable: true, default: null })
  recomendaciones: string | null;

  @Column({ name: 'cupos', type: 'int', nullable: true, default: null })
  cupos: number | null;

  @Column({ name: 'tipo_tour', type: 'text', nullable: true, default: null })
  tipo_tour: string | null;

  // 'individual' = precio por persona | 'pareja' = precio por pareja | 'grupal' = precio fijo por rango
  @Column({ name: 'modo_precio', type: 'text', default: 'individual' })
  modo_precio: 'individual' | 'grupal' | 'pareja';

  @Column({ name: 'es_promocion', type: 'boolean', default: false })
  es_promocion: boolean;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'es_borrador', type: 'boolean', default: false })
  es_borrador: boolean;

  @Index()
  @Column({ name: 'es_finalizado', type: 'boolean', default: false })
  es_finalizado: boolean;

  @Column({ name: 'sede_id', type: 'text', nullable: true })
  sede_id: string | null;

  /*
  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'sede_id', referencedColumnName: 'id_sede' })
  sede: Sede;
  */

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => BusLayout, { eager: true })
  @JoinTable({
    name: 'tour_bus_layouts',
    joinColumn: { name: 'tour_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bus_layout_id', referencedColumnName: 'id' },
  })
  busLayouts: BusLayout[];

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true, default: null })
  deleted_at: Date | null;

  @OneToMany(() => TourPrecio, (precio) => precio.tour, { eager: true, cascade: true })
  precios: TourPrecio[];

  @OneToMany(() => TourPrecioGrupal, (pg) => pg.tour, { eager: true, cascade: true })
  precios_grupales: TourPrecioGrupal[];

  // 'fecha_fija' = comportamiento original | 'multiples_fechas' = usa tabla tour_salidas | 'permanente' = sin fechas, cupos ilimitados
  @Column({ name: 'disponibilidad_tipo', type: 'text', default: 'fecha_fija' })
  disponibilidad_tipo: 'fecha_fija' | 'multiples_fechas' | 'permanente';

  @OneToMany(() => TourSalida, (s) => s.tour, { cascade: true, eager: false })
  salidas: TourSalida[];
}
