-- Migración 025: Itinerario día a día opcional en las respuestas de cotización.
-- Cada elemento es un día: { "titulo": "...", "descripciones": ["...", "..."] }.
-- El número del día es su posición; la fecha se calcula al mostrarlo.

ALTER TABLE respuestas_cotizacion
  ADD COLUMN IF NOT EXISTS itinerario jsonb NOT NULL DEFAULT '[]'::jsonb;
