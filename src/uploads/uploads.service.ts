import { Injectable, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

export interface DriveUploadResult {
  fileId: string;
  url: string;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async uploadToN8n(
    file: Express.Multer.File,
    folderId: string,
  ): Promise<DriveUploadResult> {
    const webhookUrl = this.configService.getOrThrow<string>('N8N_UPLOAD_WEBHOOK_URL');

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append('folderId', folderId);

    try {
      const response = await firstValueFrom(
        this.httpService.post<DriveUploadResult>(webhookUrl, form, {
          headers: form.getHeaders(),
          timeout: 30000,
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadGatewayException(
        `Error al subir archivo a Drive: ${error?.message ?? 'Error desconocido'}`,
      );
    }
  }
}
