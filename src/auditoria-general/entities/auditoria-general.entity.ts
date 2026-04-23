import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auditoria_general')
export class AuditoriaGeneral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'integer', nullable: true })
  usuario_id: number | null;

  @Column({ name: 'usuario_nombre', type: 'text', nullable: true })
  usuario_nombre: string | null;

  @Column({ name: 'modulo', type: 'text' })
  modulo: string;

  // 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
  @Column({ name: 'operacion', type: 'text' })
  operacion: string;

  @Column({ name: 'documento_id', type: 'text', nullable: true })
  documento_id: string | null;

  @Column({ name: 'detalle', type: 'jsonb', nullable: true })
  detalle: Record<string, any> | null;

  @CreateDateColumn({ name: 'fecha', type: 'timestamptz' })
  fecha: Date;
}
