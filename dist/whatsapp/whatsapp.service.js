"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    httpService;
    configService;
    logger = new common_1.Logger(WhatsAppService_1.name);
    apiUrl = 'https://api.ycloud.com/v2/whatsapp/messages/sendDirectly';
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
    }
    async sendMessage(to, body) {
        const apiKey = this.configService.get('YCLOUD_API_KEY');
        const from = this.configService.get('YCLOUD_WHATSAPP_FROM');
        const payload = {
            type: 'text',
            text: {
                body,
            },
            from,
            to,
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, payload, {
                headers: {
                    'X-API-Key': apiKey,
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }));
            this.logger.log(`Message sent successfully to ${to}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Error sending message to ${to}: ${error.message}`);
            if (error.response) {
                this.logger.error(`YCloud Error details: ${JSON.stringify(error.response.data)}`);
                throw error.response.data;
            }
            throw error;
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map