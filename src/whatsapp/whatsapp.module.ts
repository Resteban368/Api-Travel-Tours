import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [HttpModule],
  providers: [WhatsAppService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
