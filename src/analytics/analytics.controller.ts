import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles('admin', 'agente')
  getAnalytics(@Query('periodo') periodo: string = 'mes') {
    const validos = ['dia', 'semana', 'mes'];
    return this.analyticsService.getAnalytics(validos.includes(periodo) ? periodo : 'mes');
  }
}
