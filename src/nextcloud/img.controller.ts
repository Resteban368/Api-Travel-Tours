import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Response } from 'express';
import { NextcloudService } from './nextcloud.service';
import { Public } from '../auth/decorators/public.decorator';

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

@Controller({ path: 'i', version: VERSION_NEUTRAL })
export class ImgController {
  constructor(private readonly nextcloudService: NextcloudService) {}

  @Public()
  @Get('*')
  async getImage(@Req() req: any, @Res() res: Response) {
    const rawPath = (req.path ?? '').replace(/^\/i\//, '');
    const { folder, ownerKey, filename } = parsePath(rawPath);
    if (ownerKey) {
      await this.nextcloudService.streamImage(folder, ownerKey, filename, res);
    } else {
      await this.nextcloudService.streamImageFlat(folder, filename, res);
    }
  }

  @Delete('*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Req() req: any) {
    const rawPath = (req.path ?? '').replace(/^\/i\//, '');
    const { folder, ownerKey, filename } = parsePath(rawPath);
    const userId = req.user.id_usuario;
    await this.nextcloudService.deleteImage(
      folder,
      ownerKey ?? `u${userId}`,
      filename,
      userId,
      req.user.nombre,
    );
  }
}
