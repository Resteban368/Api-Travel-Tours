import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /v1/uploads/drive
   * Query param: folderId — ID de la carpeta de Google Drive destino
   * Body: multipart/form-data con campo "file"
   */
  @Version('1')
  @Post('drive')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadToDrive(
    @UploadedFile() file: Express.Multer.File,
    @Query('folderId') folderId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (!folderId) {
      throw new BadRequestException('El parámetro folderId es requerido');
    }

    return this.uploadsService.uploadToN8n(file, folderId);
  }
}
