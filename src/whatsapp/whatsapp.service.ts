import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendWhatsAppDirect(telefono: string, mensaje: string): Promise<void> {
    const apiKey = this.configService.get<string>('YCLOUD_API_KEY');
    const from   = this.configService.get<string>('YCLOUD_WHATSAPP_FROM');

    if (!apiKey || !from) {
      this.logger.warn('YCLOUD_API_KEY o YCLOUD_WHATSAPP_FROM no configurados — notificación omitida');
      return;
    }

    // Normalizar número: asegurar formato internacional
    const to = telefono.startsWith('+') ? telefono : `+57${telefono.replace(/\D/g, '')}`;

    try {
      await firstValueFrom(
        this.httpService.post(
          'https://api.ycloud.com/v2/whatsapp/messages',
          { from, to, type: 'text', text: { body: mensaje } },
          { headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } },
        ),
      );
      this.logger.log(`WhatsApp enviado a ${to}`);
    } catch (error) {
      // No lanzar error — la confirmación ya se guardó, la notificación es best-effort
      this.logger.error(`Error enviando WhatsApp a ${to}: ${error.message}`);
    }
  }

  async sendMessage(conversationId: number, content: string) {
    const apiToken = this.configService.get<string>('CHATWOOT_API_TOKEN');
    const baseUrl = this.configService.get<string>('CHATWOOT_BASE_URL');
    const accountId = this.configService.get<string>('CHATWOOT_ACCOUNT_ID');
    const url = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

    const payload = {
      content,
      message_type: 'outgoing',
      private: false,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Message sent successfully to conversation ${conversationId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending message to conversation ${conversationId}: ${error.message}`);
      if (error.response) {
        this.logger.error(`Chatwoot error details: ${JSON.stringify(error.response.data)}`);
        throw error.response.data;
      }
      throw error;
    }
  }
}
