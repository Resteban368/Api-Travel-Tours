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

  async sendWhatsAppDirect(telefono: string, mensaje: string, nombre = 'Cliente'): Promise<void> {
    try {
      const contactId = await this.findOrCreateChatwootContact(telefono, nombre);
      const conversationId = await this.findOrCreateConversation(contactId);
      await this.sendMessage(conversationId, mensaje);
    } catch (error) {
      this.logger.error(`Error enviando mensaje Chatwoot a ${telefono}: ${error.message}`);
    }
  }

  // ─── Chatwoot helpers ──────────────────────────────────────────────────────

  private chatwootUrl(path: string): string {
    const base = (this.configService.get<string>('CHATWOOT_BASE_URL') ?? '').replace(/\/$/, '');
    const accountId = this.configService.get<string>('CHATWOOT_ACCOUNT_ID');
    return `${base}/api/v1/accounts/${accountId}${path}`;
  }

  private chatwootHeaders() {
    return {
      api_access_token: this.configService.get<string>('CHATWOOT_API_TOKEN'),
      'Content-Type': 'application/json',
    };
  }

  private normalizePhone(telefono: string): string {
    return telefono.startsWith('+') ? telefono : `+57${telefono.replace(/\D/g, '')}`;
  }

  async findOrCreateChatwootContact(telefono: string, nombre: string): Promise<number> {
    const phone = this.normalizePhone(telefono);
    const headers = this.chatwootHeaders();

    const searchRes = await firstValueFrom(
      this.httpService.get(this.chatwootUrl('/contacts/search'), {
        params: { q: phone, include_contacts: true },
        headers,
      }),
    );

    const contacts: any[] =
      searchRes.data?.payload?.contacts ?? searchRes.data?.payload ?? [];
    const existing = contacts.find((c: any) => c.phone_number === phone);
    if (existing) return existing.id;

    const createRes = await firstValueFrom(
      this.httpService.post(
        this.chatwootUrl('/contacts'),
        { name: nombre, phone_number: phone },
        { headers },
      ),
    );
    return createRes.data?.id ?? createRes.data?.contact?.id;
  }

  async findOrCreateConversation(contactId: number): Promise<number> {
    const inboxId = this.configService.get<string>('CHATWOOT_INBOX_ID');
    const headers = this.chatwootHeaders();

    const convsRes = await firstValueFrom(
      this.httpService.get(
        this.chatwootUrl(`/contacts/${contactId}/conversations`),
        { headers },
      ),
    );

    const convs: any[] = convsRes.data?.payload ?? [];

    // Filtrar por inbox si está configurado, de lo contrario tomar cualquier conversación abierta
    const existing = inboxId
      ? convs.find((c: any) => c.inbox_id === Number(inboxId) && c.status !== 'resolved')
      : convs.find((c: any) => c.status !== 'resolved');

    if (existing) return existing.id;

    // Crear conversación solo si hay inbox configurado
    if (!inboxId) {
      throw new Error(
        `El contacto ${contactId} no tiene conversación activa en Chatwoot. ` +
        `Configura CHATWOOT_INBOX_ID para crearla automáticamente.`,
      );
    }

    const createRes = await firstValueFrom(
      this.httpService.post(
        this.chatwootUrl('/conversations'),
        { contact_id: contactId, inbox_id: Number(inboxId) },
        { headers },
      ),
    );
    return createRes.data?.id;
  }

  async sendRecordatorioSaldo(params: {
    phone: string;
    nombre: string;
    plan: string;
    fecha: string;
    cupos: string;
    saldo: string;
  }): Promise<void> {
    const webhookUrl = 'https://n8n-n8n.rvbxuq.easypanel.host/webhook/enviar-plantilla-whatsapp';

    await firstValueFrom(
      this.httpService.post(webhookUrl, params, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    this.logger.log(`Recordatorio enviado vía n8n → ${params.phone}`);
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
