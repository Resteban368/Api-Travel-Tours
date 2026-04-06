import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class WhatsAppController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsAppService);
    sendMessage(sendMessageDto: SendMessageDto): Promise<any>;
}
