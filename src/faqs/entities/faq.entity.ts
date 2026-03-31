import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn({ name: 'id_faq' })
  id_faq: number;

  @Column({ name: 'pregunta', type: 'text' })
  pregunta: string;

  @Column({ name: 'respuesta', type: 'text' })
  respuesta: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;
}
