import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('auditoria_pagos')
export class AuditoriaPago {
  @PrimaryGeneratedColumn({ name: 'id_auditoria' })
  id_auditoria: number;

  @Column({ name: 'id_pago', type: 'int' })
  id_pago: number;

  /**
   * 'EDICION'    — cualquier campo fue modificado (excepto is_validated)
   * 'VALIDACION' — el campo is_validated cambió de estado
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

  /** Se puede poblar cuando se implemente autenticación */
  @Column({ name: 'realizado_por', type: 'text', nullable: true })
  realizado_por: string | null;
}
