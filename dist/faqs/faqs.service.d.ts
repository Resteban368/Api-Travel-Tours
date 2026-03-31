import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from './dto/faqs.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class FaqsService {
    private readonly faqRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(faqRepository: Repository<Faq>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(createDto: CreateFaqDto): Promise<Faq>;
    findAll(): Promise<Faq[]>;
    findOne(id: number): Promise<Faq>;
    update(id: number, updateDto: UpdateFaqDto): Promise<Faq>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncAllFaqsToVector(): Promise<void>;
}
