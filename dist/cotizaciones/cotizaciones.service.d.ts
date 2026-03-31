import { Repository } from 'typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
export declare class CotizacionesService {
    private readonly cotizacionRepository;
    constructor(cotizacionRepository: Repository<Cotizacion>);
    create(createCotizacionDto: CreateCotizacionDto): Promise<Cotizacion>;
    findAll(): Promise<Cotizacion[]>;
    findOne(id: number): Promise<Cotizacion>;
    update(id: number, updateCotizacionDto: UpdateCotizacionDto): Promise<Cotizacion>;
    remove(id: number): Promise<Cotizacion>;
}
