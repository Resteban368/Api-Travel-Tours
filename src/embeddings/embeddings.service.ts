import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-large';

@Injectable()
export class EmbeddingsService {
  private readonly openai: OpenAI | null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  /**
   * Genera el embedding para un texto usando text-embedding-3-large (3072 dimensiones).
   */
  async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new BadRequestException(
        'OPENAI_API_KEY no está configurada. Añádela en el archivo .env para crear tours con embeddings.',
      );
    }
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim() || ' ',
    });
    return response.data[0].embedding;
  }

  /**
   * Genera el embedding para el tour: concatena título, descripción y destino
   * para que la búsqueda semántica sea sobre el contenido del tour.
   */
  async embedTourContent(tour: {
    title: string;
    description?: string | null;
    destination?: string | null;
  }): Promise<number[]> {
    const parts = [
      tour.title,
      tour.description ?? '',
      tour.destination ?? '',
    ].filter(Boolean);
    const text = parts.join('\n');
    return this.embed(text);
  }
}
