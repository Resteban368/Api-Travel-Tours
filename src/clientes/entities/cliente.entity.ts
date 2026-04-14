import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryColumn({ name: 'id_cliente', type: 'bigint' })
  id_cliente: number;

  @Column({ name: 'nombre', type: 'text', nullable: true })
  nombre: string | null;

  @Column({ name: 'telefono', type: 'text', nullable: true })
  telefono: string | null;

  @Column({ name: 'id_sede_preferida', type: 'int', nullable: true })
  id_sede_preferida: number | null;

  @Column({ name: 'id_tour_interes', type: 'int', nullable: true })
  id_tour_interes: number | null;

  @Column({ name: 'tags', type: 'text', array: true, nullable: true, default: '{}' })
  tags: string[] | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz', nullable: true })
  fecha_creacion: Date | null;
}
