import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TipoAsiento = 'normal' | 'agente' | 'conductor' | 'vacio';

export interface AsientoLayout {
  numero: string;       // Etiqueta visible (ej. "1A", "2B", "C")
  fila: number;         // Índice fila (0-based)
  columna: number;      // Índice columna (0-based)
  tipo: TipoAsiento;    // normal=cliente | agente=bloqueado | conductor | vacio=espacio vacío
}

export interface BusConfiguracion {
  filas: number;
  columnas: number;
  asientos: AsientoLayout[];
}

@Entity('bus_layouts')
export class BusLayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'int' })
  total_asientos_cliente: number; // Solo asientos tipo 'normal'

  @Column({ type: 'jsonb' })
  configuracion: BusConfiguracion;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
