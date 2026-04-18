import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ToursMaestro } from './tours-maestro.entity';

@Entity('auditoria_tours')
export class AuditoriaTour {
  @PrimaryGeneratedColumn({ name: 'id_auditoria' })
  id_auditoria: number;

  @ManyToOne(() => ToursMaestro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_tour' })
  tour: ToursMaestro;

  /**
   * Tipo de acción: 'CREACION' | 'EDICION' | 'CAMBIO_ESTADO' | 'ELIMINACION'
   */
  @Column({ name: 'accion', type: 'text' })
  accion: string;

  @Column({ name: 'campo_modificado', type: 'text', nullable: true })
  campo_modificado: string | null;

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  valor_anterior: string | null;

  @Column({ name: 'valor_nuevo', type: 'text', nullable: true })
  valor_nuevo: string | null;

  @CreateDateColumn({ name: 'fecha_auditoria', type: 'timestamptz' })
  fecha_auditoria: Date;

  @Column({ name: 'realizado_por', type: 'text', nullable: true })
  realizado_por: string | null;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;
}
