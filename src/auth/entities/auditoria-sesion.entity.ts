import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auditoria_sesiones')
export class AuditoriaSesion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'integer' })
  usuario_id: number;

  @CreateDateColumn({ name: 'fecha_inicio', type: 'timestamptz' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
  fecha_fin: Date | null;

  @Column({ name: 'duracion_segundos', type: 'integer', nullable: true })
  duracion_segundos: number | null;

  @Column({ name: 'ip', type: 'text', nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  user_agent: string | null;
}
