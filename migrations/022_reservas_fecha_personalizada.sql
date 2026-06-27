-- Migración 022: Fechas personalizadas en reservas para tours permanentes

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS fecha_inicio_personalizada DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fecha_fin_personalizada    DATE DEFAULT NULL;
