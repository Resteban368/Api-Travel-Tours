import { ConfigService } from '@nestjs/config';
export declare class EmbeddingsService {
    private config;
    private readonly openai;
    constructor(config: ConfigService);
    embed(text: string): Promise<number[]>;
    embedTourContent(tour: {
        title: string;
        description?: string | null;
        destination?: string | null;
    }): Promise<number[]>;
}
