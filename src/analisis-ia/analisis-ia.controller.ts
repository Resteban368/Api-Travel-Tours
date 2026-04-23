import { Controller, Post, Body } from '@nestjs/common';
import { AnalisisIaService, DocumentoExtraido } from './analisis-ia.service';
import { AnalizarDocumentoDto } from './dto/analizar-documento.dto';

@Controller('analisis-ia')
export class AnalisisIaController {
  constructor(private readonly analisisIaService: AnalisisIaService) {}

  @Post('analizar-documento')
  analizarDocumento(@Body() dto: AnalizarDocumentoDto): Promise<DocumentoExtraido> {
    return this.analisisIaService.analizarDocumento(dto);
  }
}
