import { Request } from 'express';
import { existsSync } from 'fs';
import { join, normalize, sep } from 'path';

export interface MarcaCotizacion {
  /** Plantilla HTML en public/ para /cotizacion/:token */
  plantilla?: string;
  /** Logo (PNG) en public/ para el PDF */
  logo?: string;
}

const PUBLIC_DIR = join(process.cwd(), 'public');

/** Ruta absoluta dentro de public/, o null si no existe o intenta salir de public/. */
export function archivoPublico(relativo?: string): string | null {
  if (!relativo) return null;
  const ruta = normalize(join(PUBLIC_DIR, relativo));
  return ruta.startsWith(PUBLIC_DIR + sep) && existsSync(ruta) ? ruta : null;
}

/**
 * Parsea COTIZACION_TEMPLATES: "dominio:plantilla[:logo],dominio2:…"
 * Ej: cotizaciones.travelclubagencia.com:cotizacion-respuesta-travelclub.html:logo-travel-club/logo-256.png
 */
export function parseMarcas(raw?: string): Map<string, MarcaCotizacion> {
  return new Map(
    (raw ?? '')
      .split(',')
      .map((entrada) => entrada.trim().split(':').map((p) => p.trim()))
      .filter(([dominio]) => dominio)
      .map(([dominio, plantilla, logo]) => [dominio.toLowerCase(), { plantilla: plantilla || undefined, logo: logo || undefined }]),
  );
}

/** Dominio público desde el que se abrió el link (Vercel lo manda en x-forwarded-host). */
export function hostDe(req: Request): string {
  return String(req.headers['x-forwarded-host'] ?? req.hostname ?? '')
    .split(',')[0]
    .split(':')[0]
    .trim()
    .toLowerCase();
}
