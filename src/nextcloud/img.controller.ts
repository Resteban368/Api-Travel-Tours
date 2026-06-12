import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Response } from 'express';
import { NextcloudService } from './nextcloud.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller({ path: 'i', version: VERSION_NEUTRAL })
export class ImgController {
  constructor(private readonly nextcloudService: NextcloudService) {}

  @Public()
  @Get(':folder/:ownerKey/:filename')
  async getImage(
    @Param('folder') folder: string,
    @Param('ownerKey') ownerKey: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.nextcloudService.streamImage(folder, ownerKey, filename, res);
  }

  @Public()
  @Get(':folder/:filename')
  async getImageFlat(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.nextcloudService.streamImageFlat(folder, filename, res);
  }

  @Delete(':folder/:ownerKey/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Param('folder') folder: string,
    @Param('ownerKey') ownerKey: string,
    @Param('filename') filename: string,
    @Req() req: any,
  ) {
    await this.nextcloudService.deleteImage(
      folder,
      ownerKey,
      filename,
      req.user.id_usuario,
      req.user.rol === 'admin',
    );
  }

  @Delete(':folder/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImageFlat(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Req() req: any,
  ) {
    await this.nextcloudService.deleteImage(
      folder,
      `u${req.user.id_usuario}`,
      filename,
      req.user.id_usuario,
      req.user.rol === 'admin',
    );
  }
}
