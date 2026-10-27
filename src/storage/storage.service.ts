import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

export interface UploadResult {
  filename: string;
  folder: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface ImageInfo {
  filename: string;
  folder: string;
  usuarioId: number;
  url: string;
}

export interface NcUploadResult {
  filename: string;
  ncPath: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface UploadError {
  archivo: string;
  motivo: string;
}

/**
 * Resultado de una subida múltiple tolerante a fallos: un archivo que falla no
 * cancela los demás, cada uno se reporta por separado.
 */
export interface UploadBatchResult<T> {
  total: number;
  exitosas: number;
  fallidas: number;
  subidas: T[];
  errores: UploadError[];
}

// Clave de carpeta de usuario: "u5", "u12", etc.
const userKey = (userId: number) => `u${userId}`;

// Subidas simultáneas contra el almacenamiento dentro de un mismo request
const CONCURRENCIA = 3;
// Intentos totales por archivo (1 inicial + 2 reintentos) ante errores transitorios
const INTENTOS = 3;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUrl: string;
  private readonly user: string;
  private readonly password: string;
  private readonly baseFolder: string;
  private readonly authHeader: string;
  // Raíz WebDAV del proveedor: Koofr "/dav/Koofr", Nextcloud "/remote.php/dav/files/{user}"
  private readonly davRoot: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly auditoria: AuditoriaGeneralService,
  ) {
    this.baseUrl = this.config('DAV_URL', 'URL', true).replace(/\/$/, '');
    this.user = this.config('USER', 'USER', true);
    this.password = this.config('PASSWORD', 'PASSWORD', true);
    this.baseFolder = this.config('BASE_FOLDER', 'BASE_FOLDER') || 'uploads';
    this.davRoot = (
      this.configService.get<string>('STORAGE_DAV_ROOT') ||
      `/remote.php/dav/files/${this.user}`
    ).replace(/\/$/, '');
    this.authHeader = `Basic ${Buffer.from(`${this.user}:${this.password}`).toString('base64')}`;
  }

  /**
   * Lee STORAGE_{key}; si no existe cae a NEXTCLOUD_{legacyKey} para no romper
   * entornos que aún tienen la configuración vieja.
   */
  private config(key: string, legacyKey: string, required = false): string {
    const value =
      this.configService.get<string>(`STORAGE_${key}`) ??
      this.configService.get<string>(`NEXTCLOUD_${legacyKey}`);
    if (required && !value) {
      throw new Error(`Falta la variable de entorno STORAGE_${key}`);
    }
    return value ?? '';
  }

  // ─── PATH HELPERS ─────────────────────────────────────────────────────────

  // Estructura: {baseFolder}/{folder}/u{userId}/filename.jpg  (folder vacío = raíz)
  private davPath(folder: string, userId: number, filename?: string): string {
    const base = folder
      ? `${this.davRoot}/${this.baseFolder}/${folder}/${userKey(userId)}`
      : `${this.davRoot}/${this.baseFolder}/${userKey(userId)}`;
    return filename ? `${base}/${filename}` : base;
  }

  // Path de la carpeta raíz de un folder (sin scope de usuario)
  private davFolderPath(folder: string): string {
    return folder
      ? `${this.davRoot}/${this.baseFolder}/${folder}`
      : `${this.davRoot}/${this.baseFolder}`;
  }

  private davUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private commonHeaders() {
    return { Authorization: this.authHeader };
  }

  // URL pública que se guarda en DB y el frontend usa
  private buildUrl(folder: string, userId: number, filename: string, apiBase: string): string {
    return folder
      ? `${apiBase}/i/${folder}/${userKey(userId)}/${filename}`
      : `${apiBase}/i/${userKey(userId)}/${filename}`;
  }

  private uniqueFilename(original: string): string {
    const ext = original.split('.').pop()?.toLowerCase() ?? 'jpg';
    return `${uuidv4()}.${ext}`;
  }

  // ─── TOLERANCIA A FALLOS ──────────────────────────────────────────────────

  /**
   * Un error es transitorio si vale la pena reintentarlo: caída de red, timeout,
   * SSL, rate limit o 5xx del almacenamiento. Un 4xx (archivo inválido, sin permisos)
   * fallaría igual en el reintento, así que se propaga de inmediato.
   */
  private esErrorTransitorio(err: unknown): boolean {
    const status = (err as AxiosError)?.response?.status;
    if (status === undefined) return true;
    return status === 429 || status >= 500;
  }

  private async conReintentos<T>(fn: () => Promise<T>): Promise<T> {
    let ultimoError: unknown;
    for (let intento = 0; intento < INTENTOS; intento++) {
      try {
        return await fn();
      } catch (err) {
        ultimoError = err;
        if (intento === INTENTOS - 1 || !this.esErrorTransitorio(err)) throw err;
        // Backoff exponencial: 300ms, 600ms
        await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** intento));
      }
    }
    throw ultimoError;
  }

  /**
   * Ejecuta `fn` sobre todos los items con como máximo `CONCURRENCIA` en vuelo.
   * `fn` nunca debe rechazar: cada worker asume que el resultado ya trae el error.
   */
  private async enParalelo<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
    const resultados = new Array<R>(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(CONCURRENCIA, items.length) }, async () => {
      for (let i = cursor++; i < items.length; i = cursor++) {
        resultados[i] = await fn(items[i]);
      }
    });

    await Promise.all(workers);
    return resultados;
  }

  private motivoDeError(err: unknown): string {
    const axiosErr = err as AxiosError;
    if (axiosErr?.response) {
      return `El almacenamiento respondió ${axiosErr.response.status}`;
    }
    return `Sin respuesta del almacenamiento: ${(err as Error)?.message ?? 'error desconocido'}`;
  }

  /** PUT de un archivo a una ruta DAV completa, con reintentos. */
  private async putArchivo(davPath: string, file: Express.Multer.File): Promise<void> {
    await this.conReintentos(() =>
      firstValueFrom(
        this.httpService.put(this.davUrl(davPath), file.buffer, {
          headers: {
            ...this.commonHeaders(),
            'Content-Type': file.mimetype,
            'Content-Length': file.size,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      ),
    );
  }

  // ─── MKCOL (crea directorio si no existe) ─────────────────────────────────

  private async mkcol(path: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.request({
          method: 'MKCOL',
          url: this.davUrl(path),
          headers: this.commonHeaders(),
        }),
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      // Sin response = error de conexión (SSL, timeout, DNS) — propagar
      if (!axiosErr.response) {
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      // 405 = carpeta ya existe, es OK
      if (axiosErr.response.status !== 405) {
        this.logger.warn(`MKCOL ${path} → ${axiosErr.response.status}`);
      }
    }
  }

  private async ensureUserFolder(folder: string, userId: number): Promise<void> {
    await this.mkcol(`${this.davRoot}/${this.baseFolder}`);
    if (folder) {
      let accumulated = this.baseFolder;
      for (const segment of folder.split('/')) {
        accumulated += `/${segment}`;
        await this.mkcol(`${this.davRoot}/${accumulated}`);
      }
    }
    await this.mkcol(this.davPath(folder, userId));
  }

  // ─── PROPFIND helper ──────────────────────────────────────────────────────

  /**
   * Extrae los <href> de un PROPFIND como rutas absolutas del servidor. Algunos
   * proveedores devuelven la URL completa (https://host/dav/...) y otros solo la
   * ruta: se normaliza quitando el origen para que la comparación con davRoot funcione.
   * Las carpetas se devuelven siempre terminadas en '/': Koofr no la incluye en el
   * href, así que se detectan por <resourcetype><collection/>.
   */
  private parseHrefs(xml: string): string[] {
    const responses = xml.match(/<(?:[^:>\s]*:)?response[\s>][\s\S]*?<\/(?:[^:>\s]*:)?response>/gi) ?? [];
    return responses.flatMap((block) => {
      const match = block.match(/<(?:[^:>\s]*:)?href>([^<]+)<\/(?:[^:>\s]*:)?href>/i);
      if (!match) return [];
      const raw = match[1].trim();
      const href = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : raw;
      const isFolder = /<(?:[^:>\s]*:)?collection\b[^>]*>/i.test(block);
      return [isFolder && !href.endsWith('/') ? `${href}/` : href];
    });
  }

  private async propfind(path: string, depth: string): Promise<string[]> {
    try {
      const res = await firstValueFrom(
        this.httpService.request<string>({
          method: 'PROPFIND',
          url: this.davUrl(path),
          headers: { ...this.commonHeaders(), Depth: depth },
          responseType: 'text',
        }),
      );
      return this.parseHrefs(res.data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (!axiosErr.response) {
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) return [];
      throw new InternalServerErrorException('Error consultando el almacenamiento');
    }
  }

  // ─── BROWSE (carpetas + imágenes en un solo call) ────────────────────────

  async browseFolder(
    folder: string,
    requesterId: number,
    isAdmin: boolean,
    apiBase: string,
  ): Promise<{ folder: string; subfolders: { folder: string }[]; images: ImageInfo[] }> {
    const folderPath = this.davFolderPath(folder);
    const hrefs = await this.propfind(folderPath, '1');
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const baseFolderPrefix = `${this.davRoot}/${this.baseFolder}/`;

    const subfolderNames: string[] = [];
    const userUids: number[] = [];

    for (const href of hrefs) {
      const decoded = decodeURIComponent(href).replace(/\/$/, '');
      const normalizedFolderPath = folderPath.replace(/\/$/, '');
      if (decoded === normalizedFolderPath) continue; // skip la carpeta raíz misma

      const lastSegment = decoded.split('/').pop() ?? '';

      if (/^u\d+$/.test(lastSegment)) {
        const uid = parseInt(lastSegment.slice(1), 10);
        if (isAdmin || uid === requesterId) userUids.push(uid);
      } else if (href.endsWith('/') && decoded.startsWith(baseFolderPrefix.slice(0, -1))) {
        const relativePath = decoded.slice(baseFolderPrefix.length);
        if (relativePath) subfolderNames.push(relativePath);
      }
    }

    const images: ImageInfo[] = [];
    for (const uid of userUids) {
      const fileHrefs = await this.propfind(this.davPath(folder, uid), '1');
      for (const fh of fileHrefs) {
        if (!imageExts.test(fh)) continue;
        const filename = decodeURIComponent(fh.split('/').pop() ?? '');
        images.push({ filename, folder, usuarioId: uid, url: this.buildUrl(folder, uid, filename, apiBase) });
      }
    }

    return {
      folder,
      subfolders: subfolderNames.map((f) => ({ folder: f })),
      images,
    };
  }

  // ─── LISTAR CARPETAS ──────────────────────────────────────────────────────

  async listFolders(): Promise<{ folder: string }[]> {
    const results: string[] = [];
    await this.collectSubfolders('', results);
    return results.map((f) => ({ folder: f }));
  }

  private async collectSubfolders(parentFolder: string, acc: string[]): Promise<void> {
    const hrefs = await this.propfind(this.davFolderPath(parentFolder), '1');
    const basePrefixPath = `${this.davRoot}/${this.baseFolder}/`;
    const userFolderPattern = /^u\d+$/;

    for (const href of hrefs) {
      if (!href.endsWith('/')) continue;
      const decoded = decodeURIComponent(href);
      if (!decoded.startsWith(basePrefixPath)) continue;

      const relative = decoded.slice(basePrefixPath.length).replace(/\/$/, '');
      if (relative === parentFolder) continue; // skip la carpeta misma

      const lastSegment = relative.split('/').pop() ?? '';
      if (!lastSegment || userFolderPattern.test(lastSegment)) continue;

      acc.push(relative);
      await this.collectSubfolders(relative, acc); // recurse en subcarpeta
    }
  }

  // ─── CREAR CARPETA ────────────────────────────────────────────────────────

  async createFolder(name: string): Promise<{ folder: string }> {
    await this.mkcol(`${this.davRoot}/${this.baseFolder}`);
    // Crea cada segmento del path en orden (WebDAV no crea intermedios automáticamente)
    let accumulated = this.baseFolder;
    for (const segment of name.split('/')) {
      accumulated += `/${segment}`;
      await this.mkcol(`${this.davRoot}/${accumulated}`);
    }
    return { folder: name };
  }

  // ─── UPLOAD ───────────────────────────────────────────────────────────────

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    userId: number,
    apiBase: string,
  ): Promise<UploadResult> {
    await this.ensureUserFolder(folder, userId);

    const filename = this.uniqueFilename(file.originalname);
    const path = this.davPath(folder, userId, filename);

    try {
      await this.putArchivo(path, file);
    } catch (err) {
      const msg = (err as AxiosError)?.response?.data ?? (err as Error).message;
      this.logger.error(`Error subiendo al almacenamiento: ${JSON.stringify(msg)}`);
      throw new InternalServerErrorException('Error al subir imagen al almacenamiento');
    }

    return {
      filename,
      folder,
      url: this.buildUrl(folder, userId, filename, apiBase),
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ─── UPLOAD MÚLTIPLE (tolerante a fallos) ────────────────────────────────

  /**
   * Sube N imágenes a {baseFolder}/{folder}/u{userId}/. Un archivo que falle no
   * cancela los demás: el resultado reporta subidas y errores por separado.
   * `rechazados` son los archivos que Multer descartó antes de llegar aquí
   * (mimetype no permitido), que se arrastran al reporte para no perderlos.
   */
  async uploadImages(
    files: Express.Multer.File[],
    folder: string,
    userId: number,
    apiBase: string,
    rechazados: UploadError[] = [],
  ): Promise<UploadBatchResult<UploadResult>> {
    const total = files.length + rechazados.length;

    // La carpeta se crea una sola vez, no por archivo
    try {
      await this.ensureUserFolder(folder, userId);
    } catch (err) {
      const motivo = this.motivoDeError(err);
      this.logger.error(`No se pudo preparar la carpeta "${folder}": ${motivo}`);
      return {
        total,
        exitosas: 0,
        fallidas: total,
        subidas: [],
        errores: [...rechazados, ...files.map((f) => ({ archivo: f.originalname, motivo }))],
      };
    }

    const resultados = await this.enParalelo(files, async (file) => {
      const filename = this.uniqueFilename(file.originalname);
      try {
        await this.putArchivo(this.davPath(folder, userId, filename), file);
        return {
          ok: true as const,
          valor: {
            filename,
            folder,
            url: this.buildUrl(folder, userId, filename, apiBase),
            size: file.size,
            mimetype: file.mimetype,
          },
        };
      } catch (err) {
        const motivo = this.motivoDeError(err);
        this.logger.error(`Falló "${file.originalname}" en ${folder}: ${motivo}`);
        return { ok: false as const, error: { archivo: file.originalname, motivo } };
      }
    });

    return this.componerReporte(resultados, rechazados, total);
  }

  private componerReporte<T>(
    resultados: ({ ok: true; valor: T } | { ok: false; error: UploadError })[],
    rechazados: UploadError[],
    total: number,
  ): UploadBatchResult<T> {
    const subidas = resultados
      .filter((r): r is { ok: true; valor: T } => r.ok)
      .map((r) => r.valor);
    const errores = [
      ...rechazados,
      ...resultados.filter((r): r is { ok: false; error: UploadError } => !r.ok).map((r) => r.error),
    ];
    return { total, exitosas: subidas.length, fallidas: errores.length, subidas, errores };
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  async listImages(
    folder: string,
    requesterId: number,
    isAdmin: boolean,
    apiBase: string,
  ): Promise<ImageInfo[]> {
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

    if (!isAdmin) {
      // Agente: solo ve su propia carpeta
      const path = this.davPath(folder, requesterId);
      const hrefs = await this.propfind(path, '1');
      return hrefs
        .filter((h) => imageExts.test(h))
        .map((href) => ({
          filename: decodeURIComponent(href.split('/').pop() ?? ''),
          folder,
          usuarioId: requesterId,
          url: this.buildUrl(folder, requesterId, decodeURIComponent(href.split('/').pop() ?? ''), apiBase),
        }));
    }

    // Admin: obtiene las subcarpetas u{id} dentro del folder y lista cada una
    const folderPath = this.davFolderPath(folder);
    const topHrefs = await this.propfind(folderPath, '1');

    // Detectar subcarpetas con patrón u{number}
    const segment = folder ? `${this.baseFolder}/${folder}` : this.baseFolder;
    const userFolderRegex = new RegExp(`/${segment}/(u\\d+)/?$`);
    const userSubfolders = topHrefs
      .map((h) => {
        const match = decodeURIComponent(h).match(userFolderRegex);
        return match ? { href: h, key: match[1] } : null;
      })
      .filter(Boolean) as { href: string; key: string }[];

    const results: ImageInfo[] = [];

    for (const sub of userSubfolders) {
      const uid = parseInt(sub.key.replace('u', ''), 10);
      const subPath = this.davPath(folder, uid);
      const fileHrefs = await this.propfind(subPath, '1');

      for (const fh of fileHrefs) {
        if (!imageExts.test(fh)) continue;
        const filename = decodeURIComponent(fh.split('/').pop() ?? '');
        results.push({
          filename,
          folder,
          usuarioId: uid,
          url: this.buildUrl(folder, uid, filename, apiBase),
        });
      }
    }

    return results;
  }

  // ─── PROXY / DESCARGA ────────────────────────────────────────────────────

  // Formato nuevo: {baseFolder}/{folder}/u{ownerId}/{filename}
  async streamImage(
    folder: string,
    ownerKey: string,
    filename: string,
    res: Response,
  ): Promise<void> {
    const ownerId = parseInt(ownerKey.replace('u', ''), 10);
    if (isNaN(ownerId)) throw new NotFoundException('Imagen no encontrada');

    await this.pipeImage(this.davPath(folder, ownerId, filename), filename, res);
  }

  // Formato plano (sin ownerKey): {baseFolder}/{folder}/{filename}
  async streamImageFlat(folder: string, filename: string, res: Response): Promise<void> {
    const path = `${this.davRoot}/${this.baseFolder}/${folder}/${filename}`;
    await this.pipeImage(path, filename, res);
  }

  private async pipeImage(path: string, filename: string, res: Response): Promise<void> {
    const fullUrl = this.davUrl(path);
    this.logger.debug(`pipeImage → ${fullUrl}`);
    let ncResponse: any;
    try {
      ncResponse = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers: this.commonHeaders(),
          responseType: 'stream',
        }),
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (!axiosErr.response) {
        this.logger.error(`pipeImage sin respuesta: ${axiosErr.message}`);
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      this.logger.error(`pipeImage status=${axiosErr.response.status} url=${fullUrl}`);
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Imagen "${filename}" no encontrada`);
      }
      throw new InternalServerErrorException(
        `Error al obtener imagen del almacenamiento (${axiosErr.response.status})`,
      );
    }

    const contentType = ncResponse.headers['content-type'] ?? 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    ncResponse.data.pipe(res);
  }

  // ─── ELIMINAR CARPETA ────────────────────────────────────────────────────

  async deleteFolder(
    folderPath: string,
    requesterId: number,
    requesterNombre: string,
  ): Promise<{ folder: string; imagenes_eliminadas: number }> {
    const davPath = this.davFolderPath(folderPath);

    // Recopilar todo el contenido antes de eliminar (para auditoría)
    const hrefs = await this.propfind(davPath, 'infinity');
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const ncFilesPrefix = `${this.davRoot}/`;
    const imagenes = hrefs
      .filter((h) => imageExts.test(h))
      .map((h) => decodeURIComponent(h).replace(ncFilesPrefix, ''));

    try {
      await firstValueFrom(
        this.httpService.delete(this.davUrl(davPath), { headers: this.commonHeaders() }),
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (!axiosErr.response) {
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Carpeta "${folderPath}" no encontrada`);
      }
      throw new InternalServerErrorException('Error al eliminar carpeta en el almacenamiento');
    }

    await this.auditoria.registrar({
      usuario_id: requesterId,
      usuario_nombre: requesterNombre,
      modulo: 'storage',
      operacion: 'ELIMINAR',
      documento_id: folderPath,
      detalle: {
        carpeta: folderPath,
        imagenes_eliminadas: imagenes.length,
        imagenes,
      },
    });

    return { folder: folderPath, imagenes_eliminadas: imagenes.length };
  }

  // ─── LISTAR TODAS LAS IMÁGENES DE UNA CARPETA (recursivo, dentro de baseFolder) ──

  async getAllImagesFromFolder(
    folder: string,
    apiBase: string,
  ): Promise<{ filename: string; path: string; url: string }[]> {
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const folderPath = this.davFolderPath(folder);
    const hrefs = await this.propfind(folderPath, 'infinity');

    const ncFilesPrefix = `${this.davRoot}/`;
    const results: { filename: string; path: string; url: string }[] = [];

    for (const href of hrefs) {
      if (!imageExts.test(href)) continue;
      const decoded = decodeURIComponent(href);
      const relativePath = decoded.startsWith(ncFilesPrefix)
        ? decoded.slice(ncFilesPrefix.length)
        : decoded;

      const urlPath = relativePath.startsWith(`${this.baseFolder}/`)
        ? relativePath.slice(this.baseFolder.length + 1)
        : relativePath;

      const filename = urlPath.split('/').pop() ?? '';
      results.push({ filename, path: urlPath, url: `${apiBase}/i/${urlPath}` });
    }

    return results;
  }

  // ─── LISTAR IMÁGENES DE RUTA DIRECTA (sin baseFolder) ────────────────────

  async listNcPathImages(
    ncPath: string,
    apiBase: string,
    recursive = false,
  ): Promise<{ filename: string; ncPath: string; url: string }[]> {
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const davPath = `${this.davRoot}/${ncPath}`;
    const depth = recursive ? 'infinity' : '1';
    const hrefs = await this.propfind(davPath, depth);

    const ncPrefix = `${this.davRoot}/`;
    const results: { filename: string; ncPath: string; url: string }[] = [];

    for (const href of hrefs) {
      if (!imageExts.test(href)) continue;
      const decoded = decodeURIComponent(href);
      const relativePath = decoded.startsWith(ncPrefix)
        ? decoded.slice(ncPrefix.length)
        : decoded;
      const filename = relativePath.split('/').pop() ?? '';
      // URL a través del proxy público /nc-photo/
      const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
      results.push({ filename, ncPath: relativePath, url: `${apiBase}/v1/storage/nc-photo/${encodedPath}` });
    }

    return results;
  }

  // ─── BROWSE RUTA DIRECTA (sin baseFolder) ──────────────────────────────

  async browseNcPath(
    ncPath: string,
    apiBase: string,
  ): Promise<{ path: string; subfolders: { path: string; name: string }[]; images: { filename: string; ncPath: string; url: string }[] }> {
    const davPath = `${this.davRoot}/${ncPath}`;
    const hrefs = await this.propfind(davPath, '1');
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const ncPrefix = `${this.davRoot}/`;

    const subfolders: { path: string; name: string }[] = [];
    const images: { filename: string; ncPath: string; url: string }[] = [];

    for (const href of hrefs) {
      const decoded = decodeURIComponent(href).replace(/\/$/, '');
      const relativePath = decoded.startsWith(ncPrefix)
        ? decoded.slice(ncPrefix.length)
        : decoded;

      // Saltar la carpeta raíz misma (con path vacío, el href es davRoot)
      if (decoded === this.davRoot || relativePath === ncPath.replace(/\/$/, '')) continue;

      if (href.endsWith('/')) {
        const name = relativePath.split('/').pop() ?? '';
        subfolders.push({ path: relativePath, name });
      } else if (imageExts.test(href)) {
        const filename = relativePath.split('/').pop() ?? '';
        const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
        images.push({ filename, ncPath: relativePath, url: `${apiBase}/v1/storage/nc-photo/${encodedPath}` });
      }
    }

    return { path: ncPath, subfolders, images };
  }

  // ─── UPLOAD DIRECTO A RUTA NC (sin estructura u{userId}) ────────────────

  async uploadToNcPath(
    file: Express.Multer.File,
    ncPath: string,
    apiBase: string,
  ): Promise<NcUploadResult> {
    await this.ensureNcPath(ncPath);

    const filename = this.uniqueFilename(file.originalname);
    const davPath = `${this.davRoot}/${ncPath}/${filename}`;

    try {
      await this.putArchivo(davPath, file);
    } catch (err) {
      const msg = (err as AxiosError)?.response?.data ?? (err as Error).message;
      this.logger.error(`Error subiendo al almacenamiento: ${JSON.stringify(msg)}`);
      throw new InternalServerErrorException('Error al subir imagen al almacenamiento');
    }

    return this.buildNcResult(ncPath, filename, file, apiBase);
  }

  /** Crea el path completo en el almacenamiento (WebDAV no crea intermedios solo). */
  private async ensureNcPath(ncPath: string): Promise<void> {
    let accumulated = '';
    for (const segment of ncPath.split('/')) {
      accumulated += (accumulated ? '/' : '') + segment;
      await this.mkcol(`${this.davRoot}/${accumulated}`);
    }
  }

  private buildNcResult(
    ncPath: string,
    filename: string,
    file: Express.Multer.File,
    apiBase: string,
  ): NcUploadResult {
    const fullNcPath = `${ncPath}/${filename}`;
    const encodedPath = fullNcPath.split('/').map(encodeURIComponent).join('/');
    return {
      filename,
      ncPath: fullNcPath,
      url: `${apiBase}/v1/storage/nc-photo/${encodedPath}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Versión múltiple de uploadToNcPath: sube N imágenes al mismo path directo de
   * almacenamiento sin abortar el lote cuando una falla.
   */
  async uploadManyToNcPath(
    files: Express.Multer.File[],
    ncPath: string,
    apiBase: string,
    rechazados: UploadError[] = [],
  ): Promise<UploadBatchResult<NcUploadResult>> {
    const total = files.length + rechazados.length;

    try {
      await this.ensureNcPath(ncPath);
    } catch (err) {
      const motivo = this.motivoDeError(err);
      this.logger.error(`No se pudo preparar la ruta "${ncPath}": ${motivo}`);
      return {
        total,
        exitosas: 0,
        fallidas: total,
        subidas: [],
        errores: [...rechazados, ...files.map((f) => ({ archivo: f.originalname, motivo }))],
      };
    }

    const resultados = await this.enParalelo(files, async (file) => {
      const filename = this.uniqueFilename(file.originalname);
      const davPath = `${this.davRoot}/${ncPath}/${filename}`;
      try {
        await this.putArchivo(davPath, file);
        return { ok: true as const, valor: this.buildNcResult(ncPath, filename, file, apiBase) };
      } catch (err) {
        const motivo = this.motivoDeError(err);
        this.logger.error(`Falló "${file.originalname}" en ${ncPath}: ${motivo}`);
        return { ok: false as const, error: { archivo: file.originalname, motivo } };
      }
    });

    return this.componerReporte(resultados, rechazados, total);
  }

  // ─── PROXY IMAGEN POR RUTA DIRECTA NC ────────────────────────────────────

  async streamNcRawPath(ncRelativePath: string, res: Response): Promise<void> {
    const path = `${this.davRoot}/${ncRelativePath}`;
    const filename = ncRelativePath.split('/').pop() ?? 'image';
    await this.pipeImage(path, filename, res);
  }

  // ─── PROXY UNIVERSAL (intenta ruta directa, luego con baseFolder) ─────────

  async streamUniversal(ncRelativePath: string, res: Response): Promise<void> {
    const filename = ncRelativePath.split('/').pop() ?? 'image';
    const directPath = `${this.davRoot}/${ncRelativePath}`;
    const basePath = `${this.davRoot}/${this.baseFolder}/${ncRelativePath}`;

    try {
      await this.pipeImage(directPath, filename, res);
    } catch {
      // Si no existe en ruta directa, intenta con el baseFolder
      await this.pipeImage(basePath, filename, res);
    }
  }

  // ─── ELIMINAR IMAGEN ──────────────────────────────────────────────────────

  async deleteImage(
    folder: string,
    ownerKey: string,
    filename: string,
    requesterId: number,
    requesterNombre: string,
  ): Promise<void> {
    const ownerId = parseInt(ownerKey.replace('u', ''), 10);
    if (isNaN(ownerId)) throw new NotFoundException('Imagen no encontrada');

    const path = this.davPath(folder, ownerId, filename);

    try {
      await firstValueFrom(
        this.httpService.delete(this.davUrl(path), { headers: this.commonHeaders() }),
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (!axiosErr.response) {
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Imagen "${filename}" no encontrada`);
      }
      throw new InternalServerErrorException('Error al eliminar imagen del almacenamiento');
    }

    await this.auditoria.registrar({
      usuario_id: requesterId,
      usuario_nombre: requesterNombre,
      modulo: 'storage',
      operacion: 'ELIMINAR',
      documento_id: filename,
      detalle: { carpeta: folder, propietario: ownerKey, filename },
    });
  }

  /** Elimina una imagen por ruta directa del almacenamiento (la que expone /nc-photo/). */
  async deleteNcRawPath(
    ncRelativePath: string,
    requesterId: number,
    requesterNombre: string,
  ): Promise<void> {
    const segments = ncRelativePath.split('/');
    const filename = segments[segments.length - 1] ?? '';
    // Solo archivos de imagen y sin segmentos que permitan salir de davRoot
    if (
      segments.some((s) => !s || s === '.' || s === '..') ||
      !/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(filename)
    ) {
      throw new NotFoundException('Imagen no encontrada');
    }

    const path = `${this.davRoot}/${ncRelativePath}`;

    try {
      await firstValueFrom(
        this.httpService.delete(this.davUrl(path), { headers: this.commonHeaders() }),
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (!axiosErr.response) {
        throw new InternalServerErrorException(
          `No se pudo conectar al almacenamiento: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Imagen "${filename}" no encontrada`);
      }
      throw new InternalServerErrorException('Error al eliminar imagen del almacenamiento');
    }

    await this.auditoria.registrar({
      usuario_id: requesterId,
      usuario_nombre: requesterNombre,
      modulo: 'storage',
      operacion: 'ELIMINAR',
      documento_id: filename,
      detalle: { ncPath: ncRelativePath, filename },
    });
  }
}
