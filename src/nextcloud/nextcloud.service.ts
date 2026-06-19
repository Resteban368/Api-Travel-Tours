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

// Clave de carpeta de usuario: "u5", "u12", etc.
const userKey = (userId: number) => `u${userId}`;

@Injectable()
export class NextcloudService {
  private readonly logger = new Logger(NextcloudService.name);
  private readonly baseUrl: string;
  private readonly ncUser: string;
  private readonly password: string;
  private readonly baseFolder: string;
  private readonly authHeader: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly auditoria: AuditoriaGeneralService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('NEXTCLOUD_URL').replace(/\/$/, '');
    this.ncUser = this.configService.getOrThrow<string>('NEXTCLOUD_USER');
    this.password = this.configService.getOrThrow<string>('NEXTCLOUD_PASSWORD');
    this.baseFolder = this.configService.get<string>('NEXTCLOUD_BASE_FOLDER') ?? 'uploads';
    this.authHeader = `Basic ${Buffer.from(`${this.ncUser}:${this.password}`).toString('base64')}`;
  }

  // ─── PATH HELPERS ─────────────────────────────────────────────────────────

  // Estructura: {baseFolder}/{folder}/u{userId}/filename.jpg  (folder vacío = raíz)
  private davPath(folder: string, userId: number, filename?: string): string {
    const base = folder
      ? `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${folder}/${userKey(userId)}`
      : `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${userKey(userId)}`;
    return filename ? `${base}/${filename}` : base;
  }

  // Path de la carpeta raíz de un folder (sin scope de usuario)
  private davFolderPath(folder: string): string {
    return folder
      ? `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${folder}`
      : `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}`;
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
          `No se pudo conectar a Nextcloud: ${axiosErr.message}`,
        );
      }
      // 405 = carpeta ya existe, es OK
      if (axiosErr.response.status !== 405) {
        this.logger.warn(`MKCOL ${path} → ${axiosErr.response.status}`);
      }
    }
  }

  private async ensureUserFolder(folder: string, userId: number): Promise<void> {
    await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${this.baseFolder}`);
    if (folder) {
      let accumulated = this.baseFolder;
      for (const segment of folder.split('/')) {
        accumulated += `/${segment}`;
        await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${accumulated}`);
      }
    }
    await this.mkcol(this.davPath(folder, userId));
  }

  // ─── PROPFIND helper ──────────────────────────────────────────────────────

  private parseHrefs(xml: string): string[] {
    const matches = xml.match(/<[^:>]*:?href>([^<]+)<\/[^:>]*:?href>/gi) ?? [];
    return matches.map((m) => m.replace(/<[^>]+>/g, '').trim());
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
          `No se pudo conectar a Nextcloud: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) return [];
      throw new InternalServerErrorException('Error consultando Nextcloud');
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
    const baseFolderPrefix = `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/`;

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
    const basePrefixPath = `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/`;
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
    await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${this.baseFolder}`);
    // Crea cada segmento del path en orden (WebDAV no crea intermedios automáticamente)
    let accumulated = this.baseFolder;
    for (const segment of name.split('/')) {
      accumulated += `/${segment}`;
      await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${accumulated}`);
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
      await firstValueFrom(
        this.httpService.put(this.davUrl(path), file.buffer, {
          headers: {
            ...this.commonHeaders(),
            'Content-Type': file.mimetype,
            'Content-Length': file.size,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );
    } catch (err) {
      const msg = (err as AxiosError)?.response?.data ?? (err as Error).message;
      this.logger.error(`Error subiendo a Nextcloud: ${JSON.stringify(msg)}`);
      throw new InternalServerErrorException('Error al subir imagen a Nextcloud');
    }

    return {
      filename,
      folder,
      url: this.buildUrl(folder, userId, filename, apiBase),
      size: file.size,
      mimetype: file.mimetype,
    };
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
    const path = `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${folder}/${filename}`;
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
          `No se pudo conectar a Nextcloud: ${axiosErr.message}`,
        );
      }
      this.logger.error(`pipeImage status=${axiosErr.response.status} url=${fullUrl}`);
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Imagen "${filename}" no encontrada`);
      }
      throw new InternalServerErrorException(
        `Error al obtener imagen de Nextcloud (${axiosErr.response.status})`,
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
    const ncFilesPrefix = `/remote.php/dav/files/${this.ncUser}/`;
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
          `No se pudo conectar a Nextcloud: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Carpeta "${folderPath}" no encontrada`);
      }
      throw new InternalServerErrorException('Error al eliminar carpeta en Nextcloud');
    }

    await this.auditoria.registrar({
      usuario_id: requesterId,
      usuario_nombre: requesterNombre,
      modulo: 'nextcloud',
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

    const ncFilesPrefix = `/remote.php/dav/files/${this.ncUser}/`;
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

  // ─── LISTAR IMÁGENES DE RUTA DIRECTA EN NEXTCLOUD (sin baseFolder) ────────

  async listNcPathImages(
    ncPath: string,
    apiBase: string,
    recursive = false,
  ): Promise<{ filename: string; ncPath: string; url: string }[]> {
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const davPath = `/remote.php/dav/files/${this.ncUser}/${ncPath}`;
    const depth = recursive ? 'infinity' : '1';
    const hrefs = await this.propfind(davPath, depth);

    const ncPrefix = `/remote.php/dav/files/${this.ncUser}/`;
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
      results.push({ filename, ncPath: relativePath, url: `${apiBase}/v1/nextcloud/nc-photo/${encodedPath}` });
    }

    return results;
  }

  // ─── BROWSE RUTA DIRECTA EN NEXTCLOUD (sin baseFolder) ──────────────────

  async browseNcPath(
    ncPath: string,
    apiBase: string,
  ): Promise<{ path: string; subfolders: { path: string; name: string }[]; images: { filename: string; ncPath: string; url: string }[] }> {
    const davPath = `/remote.php/dav/files/${this.ncUser}/${ncPath}`;
    const hrefs = await this.propfind(davPath, '1');
    const imageExts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    const ncPrefix = `/remote.php/dav/files/${this.ncUser}/`;

    const subfolders: { path: string; name: string }[] = [];
    const images: { filename: string; ncPath: string; url: string }[] = [];

    for (const href of hrefs) {
      const decoded = decodeURIComponent(href).replace(/\/$/, '');
      const relativePath = decoded.startsWith(ncPrefix)
        ? decoded.slice(ncPrefix.length)
        : decoded;

      // Saltar la carpeta raíz misma
      if (relativePath === ncPath.replace(/\/$/, '')) continue;

      if (href.endsWith('/')) {
        const name = relativePath.split('/').pop() ?? '';
        subfolders.push({ path: relativePath, name });
      } else if (imageExts.test(href)) {
        const filename = relativePath.split('/').pop() ?? '';
        const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
        images.push({ filename, ncPath: relativePath, url: `${apiBase}/v1/nextcloud/nc-photo/${encodedPath}` });
      }
    }

    return { path: ncPath, subfolders, images };
  }

  // ─── UPLOAD DIRECTO A RUTA NC (sin estructura u{userId}) ────────────────

  async uploadToNcPath(
    file: Express.Multer.File,
    ncPath: string,
    apiBase: string,
  ): Promise<{ filename: string; ncPath: string; url: string; size: number; mimetype: string }> {
    // Crear carpetas intermedias si no existen
    const segments = ncPath.split('/');
    let accumulated = '';
    for (const segment of segments) {
      accumulated += (accumulated ? '/' : '') + segment;
      await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${accumulated}`);
    }

    const filename = this.uniqueFilename(file.originalname);
    const davPath = `/remote.php/dav/files/${this.ncUser}/${ncPath}/${filename}`;

    try {
      await firstValueFrom(
        this.httpService.put(this.davUrl(davPath), file.buffer, {
          headers: {
            ...this.commonHeaders(),
            'Content-Type': file.mimetype,
            'Content-Length': file.size,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );
    } catch (err) {
      const msg = (err as AxiosError)?.response?.data ?? (err as Error).message;
      this.logger.error(`Error subiendo a Nextcloud: ${JSON.stringify(msg)}`);
      throw new InternalServerErrorException('Error al subir imagen a Nextcloud');
    }

    const fullNcPath = `${ncPath}/${filename}`;
    const encodedPath = fullNcPath.split('/').map(encodeURIComponent).join('/');
    return {
      filename,
      ncPath: fullNcPath,
      url: `${apiBase}/v1/nextcloud/nc-photo/${encodedPath}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ─── PROXY IMAGEN POR RUTA DIRECTA NC ────────────────────────────────────

  async streamNcRawPath(ncRelativePath: string, res: Response): Promise<void> {
    const path = `/remote.php/dav/files/${this.ncUser}/${ncRelativePath}`;
    const filename = ncRelativePath.split('/').pop() ?? 'image';
    await this.pipeImage(path, filename, res);
  }

  // ─── PROXY UNIVERSAL (intenta ruta directa, luego con baseFolder) ─────────

  async streamUniversal(ncRelativePath: string, res: Response): Promise<void> {
    const filename = ncRelativePath.split('/').pop() ?? 'image';
    const directPath = `/remote.php/dav/files/${this.ncUser}/${ncRelativePath}`;
    const basePath = `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${ncRelativePath}`;

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
          `No se pudo conectar a Nextcloud: ${axiosErr.message}`,
        );
      }
      if (axiosErr.response.status === 404) {
        throw new NotFoundException(`Imagen "${filename}" no encontrada`);
      }
      throw new InternalServerErrorException('Error al eliminar imagen de Nextcloud');
    }

    await this.auditoria.registrar({
      usuario_id: requesterId,
      usuario_nombre: requesterNombre,
      modulo: 'nextcloud',
      operacion: 'ELIMINAR',
      documento_id: filename,
      detalle: { carpeta: folder, propietario: ownerKey, filename },
    });
  }
}
