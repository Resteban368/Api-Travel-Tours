import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faqs.dto';

@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  create(@Body() createDto: CreateFaqDto) {
    return this.faqsService.create(createDto);
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
  ) {
    return this.faqsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faqsService.remove(id);
  }

  @Post('sync-vectors')
  syncVectors() {
    return this.faqsService.syncAllFaqsToVector();
  }
}
