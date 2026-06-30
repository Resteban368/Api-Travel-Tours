import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

const N8N_BASE_URL  = 'https://n8n-n8n.rvbxuq.easypanel.host';
const WORKFLOW_ID   = 'H0faOo6doAnWKVIL';

@Injectable()
export class N8nService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getWorkflowStatus(): Promise<{ active: boolean; name: string }> {
    const apiKey = this.config.get<string>('N8N_API_KEY');
    if (!apiKey) throw new HttpException('N8N_API_KEY no está configurada en el servidor', HttpStatus.INTERNAL_SERVER_ERROR);

    const url = `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`;
    try {
      const res = await firstValueFrom(
        this.http.get<{ active: boolean; name: string }>(url, {
          headers: { 'X-N8N-API-KEY': apiKey },
        }),
      );
      return { active: res.data.active, name: res.data.name };
    } catch (err: any) {
      const status  = err?.response?.status  ?? HttpStatus.BAD_GATEWAY;
      const message = err?.response?.data?.message ?? err?.message ?? 'Error al comunicarse con n8n';
      throw new HttpException(`n8n respondió con error: ${message}`, status);
    }
  }

  async setWorkflowActive(active: boolean): Promise<{ success: true; active: boolean }> {
    const apiKey = this.config.get<string>('N8N_API_KEY');
    if (!apiKey) {
      throw new HttpException('N8N_API_KEY no está configurada en el servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const action = active ? 'activate' : 'deactivate';
    const url = `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/${action}`;

    try {
      await firstValueFrom(
        this.http.post(url, {}, {
          headers: { 'X-N8N-API-KEY': apiKey },
        }),
      );
      return { success: true, active };
    } catch (err: any) {
      const status  = err?.response?.status  ?? HttpStatus.BAD_GATEWAY;
      const message = err?.response?.data?.message ?? err?.message ?? 'Error al comunicarse con n8n';
      throw new HttpException(
        `n8n respondió con error: ${message}`,
        status,
      );
    }
  }
}
