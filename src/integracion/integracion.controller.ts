import { Controller, Get, Param, ParseIntPipe, Version } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IntegracionService } from './integracion.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('integracion')
@Public()
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class IntegracionController {
  constructor(private readonly service: IntegracionService) {}

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
}
