import { Controller, Get, Post, Param, Req, Res, Version, HttpCode, InternalServerErrorException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RespuestasCotizacionService } from './respuestas-cotizacion.service';
import { CotizacionPdfService } from './cotizacion-pdf.service';
import { InfoEmpresaService } from '../info-empresa/info-empresa.service';
import { Public } from '../auth/decorators/public.decorator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { MarcaCotizacion, hostDe, parseMarcas } from './marcas-cotizacion';

@Controller('p')
@Public()
export class RespuestasPublicController {
  /** Dominio → plantilla/logo, desde COTIZACION_TEMPLATES (ver marcas-cotizacion.ts) */
  private readonly marcas: Map<string, MarcaCotizacion>;

  constructor(
    private readonly service: RespuestasCotizacionService,
    private readonly pdfService: CotizacionPdfService,
    private readonly infoEmpresaService: InfoEmpresaService,
    configService: ConfigService,
  ) {
    this.marcas = parseMarcas(configService.get<string>('COTIZACION_TEMPLATES'));
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Version('1')
  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Version('1')
  @Get(':token/pdf')
  async downloadPdf(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    const data = await this.service.findByToken(token);

    const empresaList = await this.infoEmpresaService.findAll().catch(() => []);
    const empresa = Array.isArray(empresaList) ? (empresaList[0] ?? {}) : (empresaList ?? {});

    let buffer: Buffer;
    try {
      const logo = this.marcas.get(hostDe(req))?.logo;
      buffer = await this.pdfService.generate(data as Record<string, any>, empresa as Record<string, any>, logo);
    } catch (err) {
      throw new InternalServerErrorException(`Error generando el PDF: ${(err as Error).message}`);
    }

    const titulo = ((data as any).titulo_viaje ?? 'cotizacion').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${titulo}.pdf"`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Version('1')
  @Post(':token/vista')
  @HttpCode(204)
  async registrarVista(@Param('token') token: string, @Req() req: Request) {
    const data = await this.service.findByToken(token);
    if (!data || (data as any)._preview) return;
    const id = (data as any).id;
    if (!id) return;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    await this.service.registrarVista(id, ip, userAgent);
  }
}
