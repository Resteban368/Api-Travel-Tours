-- Migración 024: Evitar que un mismo cliente tenga 2 reservas activas
-- para la misma salida de un tour (o para el mismo tour, si no maneja salidas).
-- Reservas 'cancelado'/'cancelada' o eliminadas lógicamente no cuentan.

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_cliente_tour_salida_activa
  ON reservas (id_responsable, id_tours, COALESCE(tour_salida_id, -1))
  WHERE estado NOT IN ('cancelado', 'cancelada') AND fecha_eliminacion IS NULL;
