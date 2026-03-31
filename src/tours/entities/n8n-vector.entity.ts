import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { toSql, fromSql } from 'pgvector/utils';

const vectorTransformer = {
  from: (val: unknown): number[] | null => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return fromSql(val) as number[];
    return null;
  },
  to: (val: number[] | null): string | null =>
    val && Array.isArray(val) ? toSql(val) : null,
};

@Entity('n8n_vectors')
export class N8nVector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  text: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({
    type: 'vector',
    length: 3072,
    nullable: true,
    transformer: vectorTransformer,
  })
  embedding: number[] | null;

  @Column({ name: 'file_id', type: 'text', nullable: true })
  fileId: string | null;

  @Column({ name: 'modifiedTime', type: 'timestamptz', nullable: true })
  modifiedTime: Date | null;
}
