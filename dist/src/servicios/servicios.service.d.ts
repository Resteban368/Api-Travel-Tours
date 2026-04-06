import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicios.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class ServiciosService {
    private readonly servicioRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(servicioRepository: Repository<Servicio>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(createDto: CreateServicioDto): Promise<Servicio>;
    findAll(): Promise<Servicio[]>;
    findOne(id: number): Promise<Servicio>;
    update(id: number, updateDto: UpdateServicioDto): Promise<Servicio>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncAllServiciosToVector(): Promise<void>;
}
