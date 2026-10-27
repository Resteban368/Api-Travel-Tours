-- Migración 028: Opiniones de clientes enviadas desde la página web.
-- Se guardan sin aprobar; solo las aprobadas se publican en la web.

CREATE TABLE IF NOT EXISTS opiniones (
  id_opinion     SERIAL PRIMARY KEY,
  nombre         VARCHAR(40)  NOT NULL,
  plan           VARCHAR(80)  DEFAULT NULL,
  texto          TEXT         NOT NULL,
  estrellas      SMALLINT     NOT NULL DEFAULT 5 CHECK (estrellas BETWEEN 1 AND 5),
  aprobada       BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opiniones_aprobadas ON opiniones (aprobada, fecha_creacion DESC);

-- La secuencia de modulos quedó atrasada respecto a max(id) y el seed de
-- ModulosService fallaba con PK duplicada al insertar el módulo 'opiniones'.
SELECT setval(pg_get_serial_sequence('modulos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM modulos));
