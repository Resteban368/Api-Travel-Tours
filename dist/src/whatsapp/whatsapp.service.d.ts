import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class WhatsAppService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    sendMessage(to: string, body: string): Promise<any>;
}
