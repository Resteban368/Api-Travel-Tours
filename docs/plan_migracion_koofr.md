# Plan: migrar almacenamiento de imágenes de Nextcloud a Koofr

Objetivo: renombrar el módulo `nextcloud` a `storage` (agnóstico del proveedor) y apuntarlo a Koofr vía WebDAV, sin romper la app Flutter ni las URLs de imágenes ya guardadas.

## Estado actual

- Módulo: `src/nextcloud/` → `NextcloudModule`, `NextcloudService` (869 líneas), `NextcloudController` (`/v1/nextcloud/*`), `ImgController` (`/i/*`).
- Solo usa WebDAV (PUT, GET, MKCOL, PROPFIND, DELETE). Nada de la API propia de Nextcloud (OCS/shares) → compatible con Koofr.
- Prefijo WebDAV fijo `/remote.php/dav/files/${ncUser}` repetido ~25 veces.
- Env: `NEXTCLOUD_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_PASSWORD`, `NEXTCLOUD_BASE_FOLDER`, `NEXTCLOUD_REJECT_UNAUTHORIZED`.
- Consumidores:
  - Flutter (`agente_viajes/lib/features/gallery/`): `/v1/nextcloud/nc-browse`, `/v1/nextcloud/nc-upload-multi`.
  - URLs generadas y posiblemente guardadas en BD: `/v1/nextcloud/nc-photo/...`, `/v1/nextcloud/image/...`, `/i/...`.
- ⚠️ Hay cambios sin commitear en `nextcloud.controller.ts` y `nextcloud.service.ts` (rama `fix/tours-auditoria-eliminacion`). Commitearlos o descartarlos antes de empezar.

## Fase 0 — Preparación

1. Rama nueva desde la rama base: `feat/storage-koofr`.
2. Verificar Koofr con curl (sin tocar código):
   ```bash
   curl -u "EMAIL:APP_PASSWORD" -X PROPFIND -H "Depth: 1" https://app.koofr.net/dav/Koofr/
   ```
   Confirmar: 207 Multi-Status y formato de `<d:href>` (¿ruta relativa `/dav/Koofr/...` o URL absoluta?).
3. Buscar en BD URLs guardadas con `/v1/nextcloud/` para decidir si hace falta mantener alias o migrar datos:
   ```sql
   -- repetir por cada tabla/columna de imágenes
   SELECT COUNT(*) FROM <tabla> WHERE <columna> LIKE '%/v1/nextcloud/%';
   ```

## Fase 1 — Renombrar módulo (sin cambio de comportamiento)

| Antes | Después |
|---|---|
| `src/nextcloud/` | `src/storage/` |
| `NextcloudModule` | `StorageModule` |
| `NextcloudService` | `StorageService` |
| `NextcloudController` | `StorageController` |
| `nextcloud.*.ts` | `storage.*.ts` |
| logs/errores "Nextcloud" | "almacenamiento" |
| `modulo: 'nextcloud'` | `modulo: 'storage'` |

- Usar `git mv` para conservar historial.
- Actualizar import en `src/app.module.ts`.
- Rutas HTTP: `@Controller(['storage', 'nextcloud'])` → `/v1/storage/*` nuevo, `/v1/nextcloud/*` como alias legacy (la app publicada y las URLs en BD siguen funcionando).
- URLs nuevas que genera el servicio (`nc-photo`, `buildUrl`) pasan a `/v1/storage/...`.
- `/i/*` queda igual.
- Compilar (`npm run build`) y probar contra Nextcloud actual: debe funcionar idéntico.

## Fase 2 — Proveedor configurable

1. Variables nuevas (con fallback a las `NEXTCLOUD_*` durante la transición):
   ```
   STORAGE_DAV_URL=https://app.koofr.net
   STORAGE_DAV_ROOT=/dav/Koofr
   STORAGE_USER=<email Koofr>
   STORAGE_PASSWORD=<contraseña de aplicación Koofr>
   STORAGE_BASE_FOLDER=<igual que NEXTCLOUD_BASE_FOLDER>
   STORAGE_REJECT_UNAUTHORIZED=true
   ```
   Para Nextcloud: `STORAGE_DAV_ROOT=/remote.php/dav/files/<usuario>`.
2. En el servicio: una sola propiedad `davRoot` y reemplazar todas las apariciones de `/remote.php/dav/files/${this.ncUser}` por `this.davRoot`. Renombrar `ncUser` → `user`.
3. `parseHrefs`: normalizar cada href quitando el origen (`new URL(href, baseUrl).pathname`) para que la comparación con prefijos funcione aunque Koofr devuelva URLs absolutas.
4. Revisar `MKCOL`: Koofr puede devolver 405 si la carpeta ya existe (igual que Nextcloud) — confirmar que se trata como "ya existe".

## Fase 3 — Migrar archivos

1. Copiar la carpeta `STORAGE_BASE_FOLDER` de Nextcloud a Koofr con la misma estructura (`<carpeta>/u<id>/<archivo>`), con rclone:
   ```bash
   rclone copy nextcloud:<BASE_FOLDER> koofr:<BASE_FOLDER> --progress
   rclone check nextcloud:<BASE_FOLDER> koofr:<BASE_FOLDER>
   ```
2. Congelar subidas durante la copia final (o hacer una segunda pasada de `rclone copy` justo antes del corte).

## Fase 4 — Pruebas

- Unit tests del servicio: `davRoot` configurable, `parseHrefs` con href relativo y absoluto.
- Manual contra Koofr (Postman):
  - [ ] `GET /v1/storage/folders`, `browse`, `nc-browse`
  - [ ] `POST image`, `images`, `nc-upload`, `nc-upload-multi`
  - [ ] `GET nc-photo/*`, `image/*`, `media/*`, `/i/*` (imagen se sirve con content-type correcto)
  - [ ] `DELETE image/*`, `folder/*`
  - [ ] Alias `/v1/nextcloud/*` sigue respondiendo
- App Flutter: galería, selector y subida múltiple.

## Fase 5 — Corte a producción

1. Configurar variables `STORAGE_*` en Vercel (production/preview) y en `.env` local. Nunca commitear la contraseña.
2. Desplegar.
3. Verificar galería en la app y una imagen vieja guardada en BD.
4. Mantener Nextcloud en solo lectura unos días como respaldo.

## Fase 6 — Limpieza (posterior)

- Flutter: renombrar `nextcloud_*` → `storage_*` en `features/gallery` y cambiar endpoints a `/v1/storage/*`.
- Cuando ya no haya URLs `/v1/nextcloud/` en BD ni versiones viejas de la app en uso: quitar el alias legacy y las variables `NEXTCLOUD_*`.
- Actualizar `API_DOCUMENTATION.md` y la colección de Postman.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Hrefs de Koofr con formato distinto rompen listados | Normalizar en `parseHrefs` + probar en Fase 0 |
| URLs viejas en BD dejan de abrir | Alias `/v1/nextcloud/*` + rutas relativas iguales tras copiar archivos |
| Límites de Koofr gratis (10 GB, rate limit) | Medir el tamaño actual de `BASE_FOLDER` antes de migrar; el retry existente cubre 429/5xx |
| Credenciales expuestas | Contraseña solo en `.env`/Vercel; regenerarla si se compartió en texto plano |
