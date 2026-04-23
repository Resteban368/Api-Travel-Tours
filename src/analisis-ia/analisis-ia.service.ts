import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { AnalizarDocumentoDto } from './dto/analizar-documento.dto';

const VISION_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `Eres un asistente especializado en extraer datos de comprobantes de pago, transferencias bancarias y recibos.
Analiza el documento y responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "monto": <número o null>,
  "tipo_documento": <string o null>,
  "proveedor_comercio": <string o null>,
  "nit": <string o null>,
  "metodo_pago": <string o null>,
  "referencia": <string o null>,
  "fecha_documento": <"YYYY-MM-DD" o null>
}
Reglas:
- monto: valor numérico sin símbolos ni puntos de miles (ej: 150000)
- fecha_documento: formato ISO 8601 YYYY-MM-DD
- Si un campo no aparece en el documento, usa null
- No inventes datos que no estén explícitamente en el documento`;

export interface DocumentoExtraido {
  monto: number | null;
  tipo_documento: string | null;
  proveedor_comercio: string | null;
  nit: string | null;
  metodo_pago: string | null;
  referencia: string | null;
  fecha_documento: string | null;
}

@Injectable()
export class AnalisisIaService {
  private readonly openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY no está configurada.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async analizarDocumento(dto: AnalizarDocumentoDto) {
    let extraido: DocumentoExtraido;

    if (dto.mime_type === 'application/pdf') {
      extraido = await this.analizarPdf(dto.imagen_base64);
    } else {
      extraido = await this.analizarImagen(dto.imagen_base64, dto.mime_type);
    }

    this.validarCamposRequeridos(extraido);

    return extraido;
  }

  private async analizarImagen(
    base64: string,
    mimeType: 'image/jpeg' | 'image/png',
  ): Promise<DocumentoExtraido> {
    const response = await this.openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Extrae los datos de pago de este comprobante.',
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0,
    });

    return this.parsearRespuesta(response.choices[0]?.message?.content ?? '');
  }

  private async analizarPdf(base64: string): Promise<DocumentoExtraido> {
    const buffer = Buffer.from(base64, 'base64');
    const data = await pdfParse(buffer);
    const textoPdf = data.text?.trim();

    if (!textoPdf) {
      throw new BadRequestException(
        'No se pudieron extraer los datos de la imagen o documento.',
      );
    }

    const response = await this.openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Extrae los datos de pago del siguiente texto de un comprobante:\n\n${textoPdf}`,
        },
      ],
      max_tokens: 500,
      temperature: 0,
    });

    return this.parsearRespuesta(response.choices[0]?.message?.content ?? '');
  }

  private parsearRespuesta(contenido: string): DocumentoExtraido {
    try {
      const limpio = contenido
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(limpio) as DocumentoExtraido;
    } catch {
      throw new BadRequestException(
        'No se pudieron extraer los datos de la imagen o documento.',
      );
    }
  }

  private validarCamposRequeridos(datos: DocumentoExtraido): void {
    const requeridos: (keyof DocumentoExtraido)[] = [
      'monto',
      'metodo_pago',
      'referencia',
      'fecha_documento',
    ];

    const faltantes = requeridos.filter((campo) => datos[campo] === null || datos[campo] === undefined);

    if (faltantes.length > 0) {
      throw new BadRequestException(
        'No se pudieron extraer los datos de la imagen o documento.',
      );
    }
  }
}
