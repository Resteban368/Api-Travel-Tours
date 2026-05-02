import { Controller, Post, Body, HttpException, HttpStatus, Version } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Version('1')
  @Post('send')
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    try {
      return await this.whatsappService.sendMessage(
        sendMessageDto.conversationId,
        sendMessageDto.content,
      );
    } catch (error) {
      throw new HttpException(
        'Error al enviar mensaje por Chatwoot',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
