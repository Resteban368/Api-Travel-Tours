import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * NestJS ya traduce los MulterError a HttpException, pero con el mensaje crudo
 * de multer en inglés ("File too large", "Unexpected field - files"), que no le
 * dice nada al cliente. Este filtro reescribe solo esos mensajes conocidos y
 * deja pasar intacta cualquier otra HttpException del controlador.
 *
 * El match es por prefijo porque multer añade " - {campo}" al mensaje.
 */
const MENSAJES: { prefijo: string; traducir: (campo: string) => string }[] = [
  {
    prefijo: 'File too large',
    traducir: () =>
      'Uno de los archivos supera el tamaño máximo permitido (20 MB)',
  },
  {
    prefijo: 'Too many files',
    traducir: () =>
      'Se enviaron más archivos de los permitidos en un solo request',
  },
  {
    prefijo: 'Unexpected field',
    traducir: (campo) =>
      `Campo de archivo inesperado${campo ? `: "${campo}"` : ''}. Para subida múltiple usa el campo "files"`,
  },
  {
    prefijo: 'Too many parts',
    traducir: () => 'El formulario tiene demasiadas partes',
  },
  {
    prefijo: 'Multipart: Boundary not found',
    traducir: () => 'El request no es un multipart/form-data válido',
  },
  {
    prefijo: 'Unexpected end of form',
    traducir: () => 'La subida se interrumpió antes de terminar',
  },
  {
    prefijo: 'Unexpected end of file',
    traducir: () => 'La subida se interrumpió antes de terminar',
  },
];

@Catch(HttpException)
export class MulterExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MulterExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const mensajeOriginal = this.extraerMensaje(body);

    const conocido = MENSAJES.find((m) =>
      mensajeOriginal.startsWith(m.prefijo),
    );
    if (!conocido) {
      // No es un error de multer: se devuelve tal cual lo generó el controlador
      res.status(status).json(body);
      return;
    }

    // multer adjunta el nombre del campo como "Unexpected field - files"
    const campo = mensajeOriginal
      .slice(conocido.prefijo.length)
      .replace(/^\s*-\s*/, '');
    const mensaje = conocido.traducir(campo);

    this.logger.warn(
      `Subida rechazada por multer: ${mensajeOriginal} → ${mensaje}`,
    );
    res
      .status(status)
      .json({ statusCode: status, message: mensaje, error: mensajeOriginal });
  }

  private extraerMensaje(body: string | object): string {
    if (typeof body === 'string') return body;
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    return '';
  }
}
