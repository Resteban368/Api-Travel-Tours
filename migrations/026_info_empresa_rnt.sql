-- Migración 026: Registro Nacional de Turismo (RNT) de la empresa.

ALTER TABLE info_empresa
  ADD COLUMN IF NOT EXISTS rnt text;
