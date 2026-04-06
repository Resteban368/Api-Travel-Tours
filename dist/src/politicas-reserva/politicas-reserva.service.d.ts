import { Repository } from 'typeorm';
import { PoliticaReserva } from './entities/politica-reserva.entity';
import { CreatePoliticaReservaDto, UpdatePoliticaReservaDto } from './dto/politicas-reserva.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class PoliticasReservaService {
    private readonly politicaRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(politicaRepository: Repository<PoliticaReserva>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(dto: CreatePoliticaReservaDto): Promise<PoliticaReserva>;
    findAll(): Promise<PoliticaReserva[]>;
    findOne(id: number): Promise<PoliticaReserva>;
    update(id: number, dto: UpdatePoliticaReservaDto): Promise<PoliticaReserva>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncAllPoliticasToVector(): Promise<void>;
}
