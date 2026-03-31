import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl = 'https://api.ycloud.com/v2/whatsapp/messages/sendDirectly';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendMessage(to: string, body: string) {
    const apiKey = this.configService.get<string>('YCLOUD_API_KEY');
    const from = this.configService.get<string>('YCLOUD_WHATSAPP_FROM');

    const payload = {
      type: 'text',
      text: {
        body,
      },
      from,
      to,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            'X-API-Key': apiKey,
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Message sent successfully to ${to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending message to ${to}: ${error.message}`);
      if (error.response) {
        this.logger.error(`YCloud Error details: ${JSON.stringify(error.response.data)}`);
        throw error.response.data;
      }
      throw error;
    }
  }
}
