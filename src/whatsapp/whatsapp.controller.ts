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
        sendMessageDto.to,
        sendMessageDto.body,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al enviar mensaje de WhatsApp',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
