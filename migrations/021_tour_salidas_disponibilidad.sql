-- Migración 021: Soporte para tours con múltiples salidas y disponibilidad permanente

-- 1. Agregar columna disponibilidad_tipo a tours_maestro
ALTER TABLE tours_maestro
  ADD COLUMN IF NOT EXISTS disponibilidad_tipo TEXT NOT NULL DEFAULT 'fecha_fija';

-- 2. Crear tabla de salidas para tours con múltiples fechas
CREATE TABLE IF NOT EXISTS tour_salidas (
  id          SERIAL PRIMARY KEY,
  tour_id     INTEGER NOT NULL REFERENCES tours_maestro(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  cupos        INTEGER DEFAULT NULL,
  label        TEXT DEFAULT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_salidas_tour_id ON tour_salidas (tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_salidas_activas ON tour_salidas (tour_id, is_active);

-- 3. Agregar columna tour_salida_id a reservas (referencia opcional)
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS tour_salida_id INTEGER DEFAULT NULL
  REFERENCES tour_salidas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_tour_salida_id ON reservas (tour_salida_id);
