import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RespuestaCotizacion } from './respuesta-cotizacion.entity';

@Entity('cotizacion_respuesta_vistas')
export class CotizacionRespuestaVista {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'respuesta_id', type: 'int' })
  respuesta_id: number;

  @ManyToOne(() => RespuestaCotizacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'respuesta_id' })
  respuesta: RespuestaCotizacion;

  @Column({ type: 'text', nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
