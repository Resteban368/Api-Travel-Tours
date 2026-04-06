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

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  id_reserva: string;

  @Column({ type: 'text' })
  correo: string;

  @Column({ type: 'text', default: 'pendiente' })
  estado: string; // 'al dia', 'pendiente', 'cancelado'

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;

  @ManyToOne(() => ToursMaestro, { eager: true })
  @JoinColumn({ name: 'id_tours' })
  tour: ToursMaestro;

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
}
