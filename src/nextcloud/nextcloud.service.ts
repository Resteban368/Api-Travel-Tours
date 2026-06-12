import {
  Injectable,
  ForbiddenException,
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
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('NEXTCLOUD_URL').replace(/\/$/, '');
    this.ncUser = this.configService.getOrThrow<string>('NEXTCLOUD_USER');
    this.password = this.configService.getOrThrow<string>('NEXTCLOUD_PASSWORD');
    this.baseFolder = this.configService.get<string>('NEXTCLOUD_BASE_FOLDER') ?? 'uploads';
    this.authHeader = `Basic ${Buffer.from(`${this.ncUser}:${this.password}`).toString('base64')}`;
  }

  // ─── PATH HELPERS ─────────────────────────────────────────────────────────

  // Estructura: {baseFolder}/{folder}/u{userId}/filename.jpg
  private davPath(folder: string, userId: number, filename?: string): string {
    const base = `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${folder}/${userKey(userId)}`;
    return filename ? `${base}/${filename}` : base;
  }

  // Path de la carpeta raíz de un folder (sin scope de usuario)
  private davFolderPath(folder: string): string {
    return `/remote.php/dav/files/${this.ncUser}/${this.baseFolder}/${folder}`;
  }

  private davUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private commonHeaders() {
    return { Authorization: this.authHeader };
  }

  // URL pública que se guarda en DB y el frontend usa
  private buildUrl(folder: string, userId: number, filename: string, apiBase: string): string {
    return `${apiBase}/i/${folder}/${userKey(userId)}/${filename}`;
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
    // Crear en orden: baseFolder → folder → u{userId}
    await this.mkcol(`/remote.php/dav/files/${this.ncUser}/${this.baseFolder}`);
    await this.mkcol(this.davFolderPath(folder));
    await this.mkcol(this.davPath(folder, userId));
  }

  // ─── PROPFIND helper ──────────────────────────────────────────────────────

  private parseHrefs(xml: string): string[] {
    const matches = xml.match(/<[^:>]*:?href>([^<]+)<\/[^:>]*:?href>/gi) ?? [];
    return matches.map((m) => m.replace(/<[^>]+>/g, '').trim());
  }

  private async propfind(path: string, depth: '0' | '1'): Promise<string[]> {
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
    const userFolderRegex = new RegExp(`/${this.baseFolder}/${folder}/(u\\d+)/?$`);
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
    let ncResponse: any;
    try {
      ncResponse = await firstValueFrom(
        this.httpService.get(this.davUrl(path), {
          headers: this.commonHeaders(),
          responseType: 'stream',
        }),
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
      throw new InternalServerErrorException('Error al obtener imagen de Nextcloud');
    }

    const contentType = ncResponse.headers['content-type'] ?? 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    ncResponse.data.pipe(res);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  async deleteImage(
    folder: string,
    ownerKey: string,        // "u5"
    filename: string,
    requesterId: number,
    isAdmin: boolean,
  ): Promise<void> {
    if (!isAdmin && ownerKey !== userKey(requesterId)) {
      throw new ForbiddenException('No puedes eliminar imágenes de otro usuario');
    }

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
  }
}
