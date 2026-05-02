import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalisisIaService, DocumentoExtraido } from './analisis-ia.service';
import { AnalizarDocumentoDto } from './dto/analizar-documento.dto';

@Controller('analisis-ia')
export class AnalisisIaController {
  constructor(private readonly analisisIaService: AnalisisIaService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('analizar-documento')
  analizarDocumento(@Body() dto: AnalizarDocumentoDto): Promise<DocumentoExtraido> {
    return this.analisisIaService.analizarDocumento(dto);
  }
}
