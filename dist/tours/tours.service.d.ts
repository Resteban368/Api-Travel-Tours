import { Repository } from 'typeorm';
import { ToursMaestro } from './entities/tours-maestro.entity';
import { N8nVector } from './entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
export declare class ToursService {
    private readonly toursMaestroRepository;
    private readonly n8nVectorsRepository;
    private readonly embeddingsService;
    constructor(toursMaestroRepository: Repository<ToursMaestro>, n8nVectorsRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(dto: CreateTourDto): Promise<ToursMaestro>;
    update(id: number, dto: UpdateTourDto): Promise<ToursMaestro>;
    findAll(): Promise<ToursMaestro[]>;
    findOne(id: number): Promise<ToursMaestro>;
    private generateSemanticChunks;
    searchByEmbedding(queryEmbedding: number[], limit?: number): Promise<Array<N8nVector & {
        similarity?: number;
    }>>;
}
