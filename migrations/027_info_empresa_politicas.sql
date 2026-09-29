-- Migración 027: Políticas de la empresa (cancelación, pagos, etc.).
-- Cada elemento: { "titulo": "...", "contenido": "..." }.

ALTER TABLE info_empresa
  ADD COLUMN IF NOT EXISTS politicas jsonb NOT NULL DEFAULT '[]'::jsonb;
