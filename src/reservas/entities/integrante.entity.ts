import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reserva } from './reserva.entity';
import { TipoDocumento } from '../../common/constants/tipo-documento';

@Entity('integrantes_reservas')
export class IntegranteReserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string | null;

  @Column({ type: 'text', nullable: true })
  tipo_documento: TipoDocumento | null;

  @Column({ type: 'text', nullable: true })
  documento: string | null;

  // Precio de categoría seleccionado al crear la reserva (snapshot)
  @Column({ name: 'tour_precio_id', type: 'int', nullable: true })
  tour_precio_id: number | null;

  @Column({
    name: 'precio_aplicado',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | number | null) => (v == null ? null : Number(v)),
    },
  })
  precio_aplicado: number | null;

  @Column({ name: 'ocupa_asiento', type: 'boolean', default: true })
  ocupa_asiento: boolean;

  @ManyToOne(() => Reserva, (reserva) => reserva.integrantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva: Reserva;
}
