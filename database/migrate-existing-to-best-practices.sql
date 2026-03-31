-- =============================================================================
-- Migración para BD existente: aplicar solo las correcciones sin borrar datos
-- Ejecutar en orden. Revisar cada bloque por si alguna columna/constraint ya existe.
-- =============================================================================

-- 1. Extensión pgvector (si no existe)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Renombrar columna camelCase en n8n_vectors (si existe modifiedTime)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'n8n_vectors' AND column_name = 'modifiedTime'
  ) THEN
    ALTER TABLE "public"."n8n_vectors" RENAME COLUMN "modifiedTime" TO "modified_time";
  END IF;
END $$;

-- 3. Ajustar tipo de embedding a vector(3072) — requiere que la tabla esté vacía o que los vectores ya sean 3072
-- Si ya tienes datos con otra dimensión, no ejecutes este bloque o haz una migración de datos.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'n8n_vectors') THEN
    -- Opción A: si la columna es tipo vector sin dimensión, puedes alterar (Postgres 0.7+ pgvector)
    -- ALTER TABLE "public"."n8n_vectors" ALTER COLUMN "embedding" TYPE vector(3072);
    -- Si falla, crear columna nueva, copiar, borrar vieja, renombrar (según tu versión de pgvector).
    NULL;
  END IF;
END $$;

-- 4. Eliminar FK duplicada en clientes (solo una referencia a id_tour_interes)
ALTER TABLE "public"."clientes"
  DROP CONSTRAINT IF EXISTS "fk_cliente_tour";

-- 5. ON DELETE explícito en FKs (opcional; ajusta según tu política)
-- ALTER TABLE "public"."clientes" DROP CONSTRAINT IF EXISTS "clientes_id_tour_interes_fkey";
-- ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_id_tour_interes_fkey"
--   FOREIGN KEY ("id_tour_interes") REFERENCES "public"."tours_maestro"("id") ON DELETE SET NULL;

-- 6. Índice HNSW para búsqueda por similitud (crear después de tener datos para mejor build)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "n8n_vectors_embedding_hnsw_idx"
--   ON "public"."n8n_vectors" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- 7. Índice por file_id si no existe
CREATE INDEX IF NOT EXISTS "n8n_vectors_file_id_idx" ON "public"."n8n_vectors" ("file_id");
CREATE INDEX IF NOT EXISTS "registro_conversaciones_chat_id_idx" ON "public"."registro_conversaciones" ("chat_id");
