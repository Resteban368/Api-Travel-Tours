import { Repository } from 'typeorm';
import { MetodoPago } from './entities/metodo-pago.entity';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class MetodosPagoService {
    private readonly metodosPagoRepository;
    private readonly n8nVectorRepository;
    private readonly embeddingsService;
    constructor(metodosPagoRepository: Repository<MetodoPago>, n8nVectorRepository: Repository<N8nVector>, embeddingsService: EmbeddingsService);
    create(createDto: CreateMetodoPagoDto): Promise<MetodoPago>;
    findAll(): Promise<MetodoPago[]>;
    findOne(id: number): Promise<MetodoPago>;
    update(id: number, updateDto: UpdateMetodoPagoDto): Promise<MetodoPago>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncAllPaymentMethodsToVector(): Promise<void>;
}
