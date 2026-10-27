import { existsSync } from 'fs';
import { join, normalize, sep } from 'path';

/** Diseño fijo de Travel Club para la cotización pública, sus políticas y el PDF (archivos en public/). */
export const MARCA_COTIZACION = {
  plantilla: 'cotizacion-respuesta-travelclub.html',
  politicas: 'politicas-travelclub.html',
  logo: 'logo-travel-club/logo-256.png',
};

const PUBLIC_DIR = join(process.cwd(), 'public');

/** Ruta absoluta dentro de public/, o null si no existe o intenta salir de public/. */
export function archivoPublico(relativo?: string): string | null {
  if (!relativo) return null;
  const ruta = normalize(join(PUBLIC_DIR, relativo));
  return ruta.startsWith(PUBLIC_DIR + sep) && existsSync(ruta) ? ruta : null;
}
