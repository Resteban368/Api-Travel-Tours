import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faqs.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('faqs')
@RequierePermiso('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  create(@Body() createDto: CreateFaqDto, @Req() req: any) {
    return this.faqsService.create(createDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Get()
  findAll() {
    return this.faqsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.faqsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFaqDto,
    @Req() req: any,
  ) {
    return this.faqsService.update(id, updateDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.faqsService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Post('sync-vectors')
  syncVectors() {
    return this.faqsService.syncAllFaqsToVector();
  }
}
