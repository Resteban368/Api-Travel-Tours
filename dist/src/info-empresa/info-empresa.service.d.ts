import { Repository } from 'typeorm';
import { InfoEmpresa } from './entities/info-empresa.entity';
import { CreateInfoEmpresaDto, UpdateInfoEmpresaDto } from './dto/info-empresa.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class InfoEmpresaService {
    private readonly infoRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(infoRepository: Repository<InfoEmpresa>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(dto: CreateInfoEmpresaDto): Promise<InfoEmpresa>;
    findAll(): Promise<InfoEmpresa[]>;
    findOne(id: number): Promise<InfoEmpresa>;
    update(id: number, dto: UpdateInfoEmpresaDto): Promise<InfoEmpresa>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncInfoToVector(): Promise<void>;
}
