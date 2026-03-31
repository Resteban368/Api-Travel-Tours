import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faqs.dto';
export declare class FaqsController {
    private readonly faqsService;
    constructor(faqsService: FaqsService);
    create(createDto: CreateFaqDto): Promise<import("./entities/faq.entity").Faq>;
    findAll(): Promise<import("./entities/faq.entity").Faq[]>;
    findOne(id: number): Promise<import("./entities/faq.entity").Faq>;
    update(id: number, updateDto: UpdateFaqDto): Promise<import("./entities/faq.entity").Faq>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncVectors(): Promise<void>;
}
