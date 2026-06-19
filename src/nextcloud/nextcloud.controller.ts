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
  UseInterceptors,
  BadRequestException,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { NextcloudService } from './nextcloud.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

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
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

@Controller('nextcloud')
export class NextcloudController {
  constructor(private readonly nextcloudService: NextcloudService) {}

  // ─── CARPETAS ─────────────────────────────────────────────────────────────

  @Get('folders')
  async listFolders() {
    return this.nextcloudService.listFolders();
  }

  @Post('folder')
  @HttpCode(HttpStatus.CREATED)
  async createFolder(@Body() dto: CreateFolderDto) {
    return this.nextcloudService.createFolder(dto.nombre);
  }

  @Delete('folder/*')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteFolder(@Req() req: any) {
    const match = (req.path ?? '').match(/\/folder\/(.+)$/);
    const folder: string = match ? decodeURIComponent(match[1]) : '';
    return this.nextcloudService.deleteFolder(folder, req.user.id_usuario, req.user.nombre);
  }

  // ─── UPLOAD ───────────────────────────────────────────────────────────────

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Tipo no permitido. Solo: ${ALLOWED_MIMES.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = '',
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.uploadImage(file, folder, req.user.id_usuario, apiBase);
  }

  // ─── BROWSE ───────────────────────────────────────────────────────────────

  @Get('browse')
  async browseFolderRoot(@Req() req: any) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.browseFolder('', req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  @Get('browse/*')
  async browseFolder(@Req() req: any) {
    const urlPath: string = req.path ?? '';
    const match = urlPath.match(/\/browse\/(.+)$/);
    const folder = match ? decodeURIComponent(match[1]) : '';
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.browseFolder(folder, req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  @Get('images/*')
  async listImages(@Req() req: any) {
    const match = (req.path ?? '').match(/\/images\/(.+)$/);
    const folder: string = match ? decodeURIComponent(match[1]) : '';
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.listImages(folder, req.user.id_usuario, req.user.rol === 'admin', apiBase);
  }

  /**
   * GET /v1/nextcloud/folder-images?folder=tours/playa
   * Devuelve TODAS las imágenes dentro de la carpeta indicada (recursivo),
   * sin importar subcarpetas de usuario. Útil para galerías públicas o de tour.
   */
  @Get('folder-images')
  async getFolderImages(
    @Query('folder', new DefaultValuePipe('')) folder: string,
    @Req() req: any,
  ) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.getAllImagesFromFolder(folder, apiBase);
  }

  /**
   * POST /v1/nextcloud/nc-upload?path=Photos/web
   * Sube una imagen directo al path indicado en Nextcloud, sin crear subcarpetas u{userId}.
   */
  @Post('nc-upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Tipo no permitido. Solo: ${ALLOWED_MIMES.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
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
    return this.nextcloudService.uploadToNcPath(file, ncPath, apiBase);
  }

  /**
   * GET /v1/nextcloud/media/Photos/web/img.jpg
   * GET /v1/nextcloud/media/tours/u5/uuid.jpg
   * Proxy universal: intenta la ruta directa y si no existe prueba con baseFolder.
   * Sirve tanto imágenes subidas directo a NC como las subidas por el endpoint regular.
   */
  @Public()
  @Get('media/*')
  async getMediaUniversal(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/media\/(.+)$/);
    const ncRelativePath = match ? decodeURIComponent(match[1]) : '';
    await this.nextcloudService.streamUniversal(ncRelativePath, res);
  }

  /**
   * GET /v1/nextcloud/nc-browse?path=Photos/Images web
   * Devuelve subcarpetas + imágenes de cualquier carpeta directa en Nextcloud
   * (sin baseFolder). Público, sin autenticación.
   */
  @Public()
  @Get('nc-browse')
  async getNcBrowse(
    @Query('path', new DefaultValuePipe('')) ncPath: string,
    @Req() req: any,
  ) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.browseNcPath(ncPath, apiBase);
  }

  /**
   * GET /v1/nextcloud/nc-folder-images?path=Photos/Images web
   * Lista todas las imágenes de una carpeta directa en Nextcloud
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
    return this.nextcloudService.listNcPathImages(ncPath, apiBase, recursive);
  }

  /**
   * GET /v1/nextcloud/nc-photo/Photos/Images web/filename.jpg
   * Proxy público para imágenes en rutas directas de Nextcloud (sin baseFolder).
   */
  @Public()
  @Get('nc-photo/*')
  async getNcPhoto(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/nc-photo\/(.+)$/);
    const ncRelativePath = match ? decodeURIComponent(match[1]) : '';
    await this.nextcloudService.streamNcRawPath(ncRelativePath, res);
  }

  // ─── PROXY / DESCARGA ────────────────────────────────────────────────────

  @Public()
  @Get('image/*')
  async getImage(@Req() req: any, @Res() res: Response) {
    const match = (req.path ?? '').match(/\/image\/(.+)$/);
    const { folder, ownerKey, filename } = parsePath(match ? decodeURIComponent(match[1]) : '');
    if (ownerKey) {
      await this.nextcloudService.streamImage(folder, ownerKey, filename, res);
    } else {
      await this.nextcloudService.streamImageFlat(folder, filename, res);
    }
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  @Delete('image/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Req() req: any) {
    const match = (req.path ?? '').match(/\/image\/(.+)$/);
    const { folder, ownerKey, filename } = parsePath(match ? decodeURIComponent(match[1]) : '');
    const userId = req.user.id_usuario;
    await this.nextcloudService.deleteImage(folder, ownerKey ?? `u${userId}`, filename, userId, req.user.nombre);
  }
}
