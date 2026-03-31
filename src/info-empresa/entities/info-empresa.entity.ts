import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('info_empresa')
export class InfoEmpresa {
  @PrimaryGeneratedColumn({ name: 'id_info' })
  id_info: number;

  @Column({ name: 'nombre', type: 'text' })
  nombre: string;

  @Column({ name: 'direccion_sede_principal', type: 'text' })
  direccion_sede_principal: string;

  @Column({ name: 'mision', type: 'text', nullable: true })
  mision: string;

  @Column({ name: 'vision', type: 'text', nullable: true })
  vision: string;

  @Column({ name: 'detalles_empresa', type: 'text', nullable: true })
  detalles_empresa: string;

  @Column({ name: 'horario_presencial', type: 'text', nullable: true })
  horario_presencial: string;

  @Column({ name: 'horario_virtual', type: 'text', nullable: true })
  horario_virtual: string;

  @Column({ name: 'redes_sociales', type: 'jsonb', nullable: true })
  redes_sociales: any; // e.g., [{ name: 'Instagram', link: '...' }]

  @Column({ name: 'nombre_gerente', type: 'text', nullable: true })
  nombre_gerente: string;

  @Column({ name: 'telefono', type: 'text', nullable: true })
  telefono: string;

  @Column({ name: 'correo', type: 'text', nullable: true })
  correo: string;

  @Column({ name: 'pagina_web', type: 'text', nullable: true })
  pagina_web: string;

  @UpdateDateColumn({ name: 'fecha_modificacion', type: 'timestamptz' })
  fecha_modificacion: Date;
}
