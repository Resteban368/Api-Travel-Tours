import { Repository } from 'typeorm';
import { Sede } from './entities/sede.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
export declare class SedesService {
    private readonly sedeRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(sedeRepository: Repository<Sede>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(dto: CreateSedeDto): Promise<Sede>;
    findAll(): Promise<Sede[]>;
    findOne(id: number): Promise<Sede>;
    update(id: number, dto: UpdateSedeDto): Promise<Sede>;
    remove(id: number): Promise<void>;
    syncAllSedesToVector(): Promise<void>;
}
