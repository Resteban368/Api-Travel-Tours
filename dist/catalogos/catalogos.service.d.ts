import { Repository } from 'typeorm';
import { Catalogo } from './entities/catalogo.entity';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';
export declare class CatalogosService {
    private readonly catalogosRepository;
    constructor(catalogosRepository: Repository<Catalogo>);
    create(createCatalogoDto: CreateCatalogoDto): Promise<Catalogo>;
    findAll(): Promise<Catalogo[]>;
    findOne(id: number): Promise<Catalogo>;
    update(id: number, updateCatalogoDto: UpdateCatalogoDto): Promise<Catalogo>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
