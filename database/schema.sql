-- =============================================================================
-- Schema con nombres originales (igual que el que usas en n8n)
-- Mejoras: vector(3072), una sola FK id_tour_interes, índice HNSW
-- =============================================================================

CREATE SCHEMA "public";
CREATE SCHEMA "finanzas";

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "public"."sedes" (
  "id_sede" serial PRIMARY KEY,
  "nombre_sede" text NOT NULL CONSTRAINT "sedes_nombre_sede_key" UNIQUE,
  "direccion" text,
  "telefono" text,
  "link_map" text
);

CREATE TABLE "public"."tours_maestro" (
  "id" serial PRIMARY KEY,
  "id_tour" integer NOT NULL CONSTRAINT "tours_maestro_id_tour_key" UNIQUE,
  "nombre_tour" text NOT NULL,
  "link_pdf" text,
  "estado" boolean DEFAULT true,
  "sede_id" integer,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."tours_maestro" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tours_maestro" ADD CONSTRAINT "tours_maestro_sede_id_fkey"
  FOREIGN KEY ("sede_id") REFERENCES "public"."sedes"("id_sede") ON DELETE SET NULL;

CREATE TABLE "public"."catalogos" (
  "id_catalogo" serial PRIMARY KEY,
  "id_sede" integer,
  "nombre_catalogo" text NOT NULL,
  "url_archivo" text NOT NULL,
  "activo" boolean DEFAULT true,
  "fecha_creacion" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."catalogos" ADD CONSTRAINT "catalogos_id_sede_fkey"
  FOREIGN KEY ("id_sede") REFERENCES "public"."sedes"("id_sede") ON DELETE CASCADE;

CREATE TABLE "public"."clientes" (
  "id_cliente" bigint PRIMARY KEY,
  "nombre" text,
  "id_sede_preferida" integer,
  "fecha_creacion" timestamp with time zone DEFAULT now(),
  "id_tour_interes" integer,
  "telefono" text,
  "tags" text[] DEFAULT '{}'
);

ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_id_sede_preferida_fkey"
  FOREIGN KEY ("id_sede_preferida") REFERENCES "public"."sedes"("id_sede") ON DELETE SET NULL;
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_id_tour_interes_fkey"
  FOREIGN KEY ("id_tour_interes") REFERENCES "public"."tours_maestro"("id") ON DELETE SET NULL;

CREATE TABLE "public"."ingested_files" (
  "file_id" text PRIMARY KEY,
  "name" text,
  "mime_type" text,
  "md5_checksum" text,
  "modified_time" timestamp with time zone,
  "last_ingested" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."n8n_vectors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" text,
  "metadata" jsonb,
  "embedding" vector(3072),
  "file_id" text,
  "modifiedTime" timestamp with time zone
);

CREATE INDEX "n8n_vectors_embedding_hnsw_idx"
  ON "public"."n8n_vectors" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE "public"."registro_conversaciones" (
  "id" serial PRIMARY KEY,
  "chat_id" varchar(50),
  "mensaje_usuario" text,
  "respuesta_ia" text,
  "fecha" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "catalogos_pkey" ON "public"."catalogos" ("id_catalogo");
CREATE UNIQUE INDEX "clientes_pkey" ON "public"."clientes" ("id_cliente");
CREATE UNIQUE INDEX "ingested_files_pkey" ON "public"."ingested_files" ("file_id");
CREATE UNIQUE INDEX "n8n_vectors_pkey" ON "public"."n8n_vectors" ("id");
CREATE UNIQUE INDEX "registro_conversaciones_pkey" ON "public"."registro_conversaciones" ("id");
CREATE UNIQUE INDEX "sedes_nombre_sede_key" ON "public"."sedes" ("nombre_sede");
CREATE UNIQUE INDEX "sedes_pkey" ON "public"."sedes" ("id_sede");
CREATE UNIQUE INDEX "tours_maestro_id_tour_key" ON "public"."tours_maestro" ("id_tour");
CREATE UNIQUE INDEX "tours_maestro_pkey" ON "public"."tours_maestro" ("id");
