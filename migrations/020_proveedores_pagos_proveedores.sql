-- ─── Proveedores ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proveedores (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('hotel', 'aerolinea', 'transporte', 'seguro', 'otro')),
  nit          TEXT,
  telefono     TEXT,
  email        TEXT,
  banco        TEXT,
  numero_cuenta TEXT,
  notas        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_tipo      ON proveedores (tipo);
CREATE INDEX IF NOT EXISTS idx_proveedores_is_active ON proveedores (is_active);

-- ─── Pagos a Proveedores ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pagos_proveedores (
  id                 SERIAL PRIMARY KEY,
  proveedor_id       INT NOT NULL REFERENCES proveedores (id) ON DELETE RESTRICT,
  tour_id            INT REFERENCES tours_maestro (id) ON DELETE SET NULL,
  hotel_id           INT REFERENCES hoteles (id) ON DELETE SET NULL,
  concepto           TEXT NOT NULL,
  monto              NUMERIC(14, 2) NOT NULL,
  moneda             TEXT NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD', 'EUR')),
  fecha_pago         DATE NOT NULL,
  metodo_pago_id     INT REFERENCES metodos_pago (id_metodo_pago) ON DELETE SET NULL,
  comprobante_url    TEXT,
  notas              TEXT,
  creado_por_id      INT,
  creado_por_nombre  TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Solo tour_id o hotel_id, no ambos
  CONSTRAINT chk_vinculacion CHECK (NOT (tour_id IS NOT NULL AND hotel_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_pagos_prov_proveedor  ON pagos_proveedores (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prov_tour        ON pagos_proveedores (tour_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prov_hotel       ON pagos_proveedores (hotel_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prov_fecha       ON pagos_proveedores (fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_prov_is_active   ON pagos_proveedores (is_active);
