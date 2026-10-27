import { Controller, Get, Post, Body, Param, ParseIntPipe, Version, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IntegracionService } from './integracion.service';
import { Public } from '../auth/decorators/public.decorator';
import { OpinionesService } from '../opiniones/opiniones.service';
import { CreateOpinionPublicaDto } from '../opiniones/dto/opiniones.dto';

@Controller('integracion')
@Public()
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class IntegracionController {
  constructor(
    private readonly service: IntegracionService,
    private readonly opinionesService: OpinionesService,
  ) {}

  // ── Tours ──────────────────────────────────────────────────────────────────

  @Version('1')
  @Get('tours')
  findTours() {
    return this.service.findTours();
  }

  @Version('1')
  @Get('tours/:id')
  findTour(@Param('id', ParseIntPipe) id: number) {
    return this.service.findTour(id);
  }

  // ── Servicios ──────────────────────────────────────────────────────────────

  @Version('1')
  @Get('servicios')
  findServicios() {
    return this.service.findServicios();
  }

  // ── FAQs ───────────────────────────────────────────────────────────────────

  @Version('1')
  @Get('faqs')
  findFaqs() {
    return this.service.findFaqs();
  }

  // ── Opiniones ──────────────────────────────────────────────────────────────

  @Version('1')
  @Get('opiniones')
  findOpiniones() {
    return this.opinionesService.findAprobadas();
  }

  // Se guardan sin aprobar; solo aparecen en el GET cuando un admin las aprueba
  @Version('1')
  @Post('opiniones')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  crearOpinion(@Body() dto: CreateOpinionPublicaDto) {
    return this.opinionesService.crearDesdeWeb(dto);
  }
}
