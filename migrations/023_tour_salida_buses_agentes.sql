-- Migración 023: Buses y agentes por salida en tours con múltiples fechas

-- 1. Tabla de buses asignados por salida
CREATE TABLE IF NOT EXISTS tour_salida_bus_layouts (
  id             SERIAL PRIMARY KEY,
  tour_salida_id INTEGER NOT NULL REFERENCES tour_salidas(id) ON DELETE CASCADE,
  bus_layout_id  INTEGER NOT NULL REFERENCES bus_layouts(id) ON DELETE CASCADE,
  UNIQUE (tour_salida_id, bus_layout_id)
);
CREATE INDEX IF NOT EXISTS idx_tour_salida_bus_layouts_salida ON tour_salida_bus_layouts (tour_salida_id);

-- 2. Columna tour_salida_id en tour_bus_agentes
--    null = agentes a nivel tour (fecha_fija)
--    número = agentes por salida (multiples_fechas)
ALTER TABLE tour_bus_agentes
  ADD COLUMN IF NOT EXISTS tour_salida_id INTEGER DEFAULT NULL
  REFERENCES tour_salidas(id) ON DELETE CASCADE;
