import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { NextcloudService } from './nextcloud.service';
import { Public } from '../auth/decorators/public.decorator';

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
    @Query('folder') folder: string = 'general',
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const apiBase = `${req.protocol}://${req.get('host')}`;
    return this.nextcloudService.uploadImage(file, folder, req.user.id_usuario, apiBase);
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  @Get('images/:folder')
  async listImages(@Param('folder') folder: string, @Req() req: any) {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    const isAdmin = req.user.rol === 'admin';
    return this.nextcloudService.listImages(folder, req.user.id_usuario, isAdmin, apiBase);
  }

  // ─── PROXY / DESCARGA ────────────────────────────────────────────────────

  /**
   * GET /v1/nextcloud/image/:folder/:ownerKey/:filename
   * Público — cualquiera con la URL puede ver la imagen.
   * :ownerKey = "u5"
   */
  @Public()
  @Get('image/:folder/:ownerKey/:filename')
  async getImage(
    @Param('folder') folder: string,
    @Param('ownerKey') ownerKey: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.nextcloudService.streamImage(folder, ownerKey, filename, res);
  }

  /**
   * GET /v1/nextcloud/image/:folder/:filename
   * Público — formato sin ownerKey (URLs antiguas / estructura plana).
   */
  @Public()
  @Get('image/:folder/:filename')
  async getImageFlat(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.nextcloudService.streamImageFlat(folder, filename, res);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  @Delete('image/:folder/:ownerKey/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Param('folder') folder: string,
    @Param('ownerKey') ownerKey: string,
    @Param('filename') filename: string,
    @Req() req: any,
  ) {
    const isAdmin = req.user.rol === 'admin';
    await this.nextcloudService.deleteImage(
      folder,
      ownerKey,
      filename,
      req.user.id_usuario,
      isAdmin,
    );
  }

  @Delete('image/:folder/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImageFlat(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Req() req: any,
  ) {
    const ownerKey = `u${req.user.id_usuario}`;
    const isAdmin = req.user.rol === 'admin';
    await this.nextcloudService.deleteImage(
      folder,
      ownerKey,
      filename,
      req.user.id_usuario,
      isAdmin,
    );
  }
}
