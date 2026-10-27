import {
  Controller,
  Post,
  Get,
  Delete,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseFilters,
  BadRequestException,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService, UploadBatchResult, UploadError } from './storage.service';
import { MulterExceptionFilter } from './filters/multer-exception.filter';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

class CreateNcFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  path: string;
}

class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/, {
    message: 'Solo letras, números, guiones y guiones bajos. Use / para subcarpetas (ej: tours/2026)',
  })
  @MaxLength(100)
  nombre: string;
}

function parsePath(rawPath: string): { folder: string; ownerKey: string | null; filename: string } {
  const segments = (rawPath ?? '').split('/').filter(Boolean);
  if (segments.length < 2) return { folder: '', ownerKey: null, filename: segments[0] ?? '' };
  const filename = segments[segments.length - 1];
  const possibleOwnerKey = segments[segments.length - 2];
  if (/^u\d+$/.test(possibleOwnerKey)) {
    return { folder: segments.slice(0, -2).join('/'), ownerKey: possibleOwnerKey, filename };
  }
  return { folder: segments.slice(0, -1).join('/'), ownerKey: null, filename };
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
// Multer guarda todo en memoria: MAX_FILES × MAX_SIZE_BYTES es el peor caso de RAM por request
const MAX_FILES = 10;
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

type FileFilter = NonNullable<NonNullable<Parameters<typeof FileInterceptor>[1]>['fileFilter']>;

/**
 * Filtro estricto para los endpoints de archivo único: un mimetype inválido
 * aborta el request con 400.
 */
const filtroEstricto: FileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new BadRequestException(`Tipo no permitido. Solo: ${ALLOWED_MIMES.join(', ')}`), false);
  }
  cb(null, true);
};

/**
 * Filtro tolerante para subida múltiple: en vez de tumbar el lote entero,
 * descarta el archivo inválido (cb(null, false)) y lo anota en el request para
 * que el handler lo reporte junto a los demás errores.
 */
const filtroTolerante: FileFilter = (req: any, file, cb) => {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    const rechazados: UploadError[] = (req.archivosRechazados ??= []);
    rechazados.push({
      archivo: file.originalname,
      motivo: `Tipo no permitido (${file.mimetype}). Solo: ${ALLOWED_MIMES.join(', ')}`,
    });
    return cb(null, false);
  }
  cb(null, true);
};

const opcionesMultiples = {
  limits: { fileSize: MAX_SIZE_BYTES, files: MAX_FILES },
  fileFilter: filtroTolerante,
};

/**
 * 201 si todo subió, 207 si hubo mezcla, 502 si el almacenamiento rechazó todo.
 * El cuerpo es siempre el mismo reporte, así el cliente lo lee igual en los tres casos.
 */
function estadoDelLote(reporte: UploadBatchResult<unknown>): number {
  if (reporte.fallidas === 0) return HttpStatus.CREATED;
  if (reporte.exitosas > 0) return 207; // Multi-Status
  return HttpStatus.BAD_GATEWAY;
}

/**
 * Ningún archivo válido llegó al servicio: o no se envió nada, o todos los
 * archivos fueron descartados por tipo. Es culpa del cliente, no del almacenamiento,
 * así que responde 400 con el mismo formato de reporte.
 */
function loteSinArchivosValidos(rechazados: UploadError[]): UploadBatchResult<never> {
  if (!rechazados.length) {
    throw new BadRequestException('No se recibió ningún archivo (usa el campo "files")');
  }
  return {
    total: rechazados.length,
    exitosas: 0,
    fallidas: rechazados.length,
    subidas: [],
    errores: rechazados,
  };
}

// 'nextcloud' se mantiene como alias para la app publicada y las URLs ya guardadas en BD
@Controller(['storage', 'nextcloud'])
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // ─── CARPETAS ─────────────────────────────────────────────────────────────

  @Get('folders')
  async listFolders() {
    return this.storageService.listFolders();
  }

  @Post('folder')
  @HttpCode(HttpStatus.CREATED)
  async createFolder(@Body() dto: CreateFolderDto) {
    return this.storageService.createFolder(dto.nombre);
  }

  @Delete('folder/*')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteFolder(@Req() req: any) {
    const match = (req.path ?? '').match(/\/folder\/(.+)$/);
    const folder: string = match ? decodeURIComponent(match[1]) : '';
    return this.storageService.deleteFolder(folder, req.user.id_usuario, req.user.nombre);
  }

  /**
   * POST /v1/storage/nc-folder  { "path": "Photos/PLANES/2026" }
   * Crea una carpeta por ruta directa del almacenamiento (la misma que usa nc-browse).
   */
  @Post('nc-folder')
  @HttpCode(HttpStatus.CREATED)
  async createNcFolder(@Body() dto: CreateNcFolderDto) {
    return this.storageService.createNcFolder(dto.path);
  }

  /**
   * DELETE /v1/storage/nc-folder/Photos/PLANES/2026
   * Elimina una carpeta (y su contenido) por ruta directa del almacenamiento.
   */
  @Delete('nc-folder/*')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteNcFolder(@Req() req: any) {
    const match = (req.path ?? '').match(/\/nc-folder\/(.+)$/);
    const ncPath: string = match ? decodeURIComponent(match[1]) : '';
    return this.storageService.deleteNcFolder(ncPath, req.user.id_usuario, req.user.nombre);
  }

  // ─── UPLOAD ───────────────────────────────────────────────────────────────

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: filtroEstricto,
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = '',
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.uploadImage(file, folder, req.user.id_usuario, apiBase);
  }

  /**
   * POST /v1/storage/images?folder=tours/playa
   * Subida múltiple (campo "files", hasta 10 archivos) tolerante a fallos:
   * un archivo que falle no cancela los demás.
   * → 201 si todas subieron, 207 si hubo mezcla, 502 si ninguna se salvó.
   */
  @Post('images')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, opcionesMultiples))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder', new DefaultValuePipe('')) folder: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rechazados: UploadError[] = req.archivosRechazados ?? [];
    if (!files?.length) {
      res.status(HttpStatus.BAD_REQUEST);
      return loteSinArchivosValidos(rechazados);
    }

    const apiBase = `${req.protocol}://${req.get('host')}`;
    const reporte = await this.storageService.uploadImages(
      files,
      folder,
      req.user.id_usuario,
      apiBase,
      rechazados,
    );

    res.status(estadoDelLote(reporte));
    return reporte;
  }

  // ─── BROWSE ───────────────────────────────────────────────────────────────

  @Get('browse')
  async browseFolderRoot(@Req() req: any) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.browseFolder('', req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  @Get('browse/*')
  async browseFolder(@Req() req: any) {
    const urlPath: string = req.path ?? '';
    const match = urlPath.match(/\/browse\/(.+)$/);
    const folder = match ? decodeURIComponent(match[1]) : '';
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.browseFolder(folder, req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  @Get('images/*')
  async listImages(@Req() req: any) {
    const match = (req.path ?? '').match(/\/images\/(.+)$/);
    const folder: string = match ? decodeURIComponent(match[1]) : '';
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.listImages(folder, req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  /**
   * GET /v1/storage/folder-images?folder=tours/playa
   * Devuelve TODAS las imágenes dentro de la carpeta indicada (recursivo),
   * sin importar subcarpetas de usuario. Útil para galerías públicas o de tour.
   */
  @Get('folder-images')
  async getFolderImages(
    @Query('folder', new DefaultValuePipe('')) folder: string,
    @Req() req: any,
  ) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.getAllImagesFromFolder(folder, apiBase);
  }

  /**
   * POST /v1/storage/nc-upload?path=Photos/web
   * Sube una imagen directo al path indicado en el almacenamiento, sin crear subcarpetas u{userId}.
   */
  @Post('nc-upload')
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: filtroEstricto,
    }),
  )
  async uploadToNcPath(
    @UploadedFile() file: Express.Multer.File,
    @Query('path', new DefaultValuePipe('')) ncPath: string,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (!ncPath) throw new BadRequestException('El parámetro path es requerido');
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.uploadToNcPath(file, ncPath, apiBase);
  }

  /**
   * POST /v1/storage/nc-upload-multi?path=Photos/web
   * Subida múltiple directa a una ruta del almacenamiento (campo "files", hasta 10),
   * con la misma tolerancia a fallos que /images.
   */
  @Post('nc-upload-multi')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, opcionesMultiples))
  async uploadManyToNcPath(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('path', new DefaultValuePipe('')) ncPath: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!ncPath) throw new BadRequestException('El parámetro path es requerido');

    const rechazados: UploadError[] = req.archivosRechazados ?? [];
    if (!files?.length) {
      res.status(HttpStatus.BAD_REQUEST);
      return loteSinArchivosValidos(rechazados);
    }

    const apiBase = `${req.protocol}://${req.get('host')}`;
    const reporte = await this.storageService.uploadManyToNcPath(
      files,
      ncPath,
      apiBase,
      rechazados,
    );

    res.status(estadoDelLote(reporte));
    return reporte;
  }

  /**
   * GET /v1/storage/media/Photos/web/img.jpg
   * GET /v1/storage/media/tours/u5/uuid.jpg
   * Proxy universal: intenta la ruta directa y si no existe prueba con baseFolder.
   * Sirve tanto imágenes subidas directo a una ruta como las subidas por el endpoint regular.
   */
  @Public()
  @Get('media/*')
  async getMediaUniversal(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/media\/(.+)$/);
    const ncRelativePath = match ? decodeURIComponent(match[1]) : '';
    await this.storageService.streamUniversal(ncRelativePath, res);
  }

  /**
   * GET /v1/storage/nc-browse?path=Photos/Images web
   * Devuelve subcarpetas + imágenes de cualquier carpeta directa del almacenamiento
   * (sin baseFolder). Público, sin autenticación.
   */
  @Public()
  @Get('nc-browse')
  async getNcBrowse(
    @Query('path', new DefaultValuePipe('')) ncPath: string,
    @Req() req: any,
  ) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.browseNcPath(ncPath, apiBase);
  }

  /**
   * GET /v1/storage/nc-folder-images?path=Photos/Images web
   * Lista todas las imágenes de una carpeta directa del almacenamiento
   * (sin el baseFolder, útil para carpetas como "Photos/Images web").
   * ?recursive=true para incluir subcarpetas.
   */
  @Public()
  @Get('nc-folder-images')
  async getNcFolderImages(
    @Query('path', new DefaultValuePipe('')) ncPath: string,
    @Query('recursive', new DefaultValuePipe(false), ParseBoolPipe) recursive: boolean,
    @Req() req: any,
  ) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.storageService.listNcPathImages(ncPath, apiBase, recursive);
  }

  /**
   * GET /v1/storage/nc-photo/Photos/Images web/filename.jpg
   * Proxy público para imágenes en rutas directas del almacenamiento (sin baseFolder).
   */
  @Public()
  @Get('nc-photo/*')
  async getNcPhoto(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/nc-photo\/(.+)$/);
    const ncRelativePath = match ? decodeURIComponent(match[1]) : '';
    await this.storageService.streamNcRawPath(ncRelativePath, res);
  }

  // ─── PROXY / DESCARGA ────────────────────────────────────────────────────

  @Public()
  @Get('image/*')
  async getImage(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/image\/(.+)$/);
    const { folder, ownerKey, filename } = parsePath(match ? decodeURIComponent(match[1]) : '');
    if (ownerKey) {
      await this.storageService.streamImage(folder, ownerKey, filename, res);
    } else {
      await this.storageService.streamImageFlat(folder, filename, res);
    }
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  @Delete('image/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Req() req: any) {
    const match = (req.path ?? '').match(/\/image\/(.+)$/);
    const { folder, ownerKey, filename } = parsePath(match ? decodeURIComponent(match[1]) : '');
    const userId = req.user.id_usuario;
    await this.storageService.deleteImage(folder, ownerKey ?? `u${userId}`, filename, userId, req.user.nombre);
  }

  /**
   * DELETE /v1/storage/nc-photo/Photos/filename.jpg
   * Elimina una imagen por su ruta directa (la misma URL que sirve el GET nc-photo).
   */
  @Delete('nc-photo/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNcPhoto(@Req() req: any) {
    const match = (req.path ?? '').match(/\/nc-photo\/(.+)$/);
    const ncRelativePath = match ? decodeURIComponent(match[1]) : '';
    await this.storageService.deleteNcRawPath(ncRelativePath, req.user.id_usuario, req.user.nombre);
  }
}
