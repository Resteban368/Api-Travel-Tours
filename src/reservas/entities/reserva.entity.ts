import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ToursMaestro } from '../../tours/entities/tours-maestro.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';
import { IntegranteReserva } from './integrante.entity';
import { ClienteApp } from '../../clientes/entities/cliente-app.entity';
import { VueloReserva } from './vuelo-reserva.entity';
import { HotelReserva } from './hotel-reserva.entity';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  id_reserva: string;

  @Column({ name: 'tipo_reserva', type: 'text', default: 'tour' })
  tipo_reserva: string; // 'tour' | 'vuelos' | extensible

  @Column({ type: 'text' })
  correo: string;

  @Column({ type: 'text', default: 'pendiente' })
  estado: string; // 'al dia', 'pendiente', 'cancelado'

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'creado_por_id', type: 'integer', nullable: true })
  creado_por_id: number | null;

  @Column({
    name: 'descuento_por_persona',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value == null ? 0 : Number(value)),
    },
  })
  descuento_por_persona: number;

  @Column({
    name: 'valor_sin_descuento',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value == null ? 0 : Number(value)),
    },
  })
  valor_sin_descuento: number;

  @Column({
    name: 'valor_total',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value == null ? 0 : Number(value)),
    },
  })
  valor_total: number;

  @Column({
    name: 'utilidad',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | number | null) => (value == null ? null : Number(value)),
    },
  })
  utilidad: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;

  @ManyToOne(() => ClienteApp, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_responsable' })
  responsable: ClienteApp | null;

  @ManyToOne(() => ToursMaestro, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_tours' })
  tour: ToursMaestro | null;

  @ManyToMany(() => Servicio, { eager: true })
  @JoinTable({
    name: 'reservas_servicios',
    joinColumn: { name: 'reserva_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'servicio_id', referencedColumnName: 'id_servicio' },
  })
  servicios: Servicio[];

  @OneToMany(() => IntegranteReserva, (integrante) => integrante.reserva, {
    cascade: true,
    eager: true,
  })
  integrantes: IntegranteReserva[];

  @OneToMany(() => VueloReserva, (vuelo) => vuelo.reserva, {
    cascade: true,
    eager: true,
  })
  vuelos: VueloReserva[];

  @OneToMany(() => HotelReserva, (hotel) => hotel.reserva, {
    cascade: true,
    eager: true,
  })
  hoteles: HotelReserva[];
}
