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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const EMBEDDING_MODEL = 'text-embedding-3-large';
let EmbeddingsService = class EmbeddingsService {
    config;
    openai;
    constructor(config) {
        this.config = config;
        const apiKey = this.config.get('OPENAI_API_KEY');
        this.openai = apiKey ? new openai_1.default({ apiKey }) : null;
    }
    async embed(text) {
        if (!this.openai) {
            throw new common_1.BadRequestException('OPENAI_API_KEY no está configurada. Añádela en el archivo .env para crear tours con embeddings.');
        }
        const response = await this.openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text.trim() || ' ',
        });
        return response.data[0].embedding;
    }
    async embedTourContent(tour) {
        const parts = [
            tour.title,
            tour.description ?? '',
            tour.destination ?? '',
        ].filter(Boolean);
        const text = parts.join('\n');
        return this.embed(text);
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map