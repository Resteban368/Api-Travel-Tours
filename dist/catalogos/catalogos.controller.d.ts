import { CatalogosService } from './catalogos.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';
export declare class CatalogosController {
    private readonly catalogosService;
    constructor(catalogosService: CatalogosService);
    create(createCatalogoDto: CreateCatalogoDto): Promise<import("./entities/catalogo.entity").Catalogo>;
    findAll(): Promise<import("./entities/catalogo.entity").Catalogo[]>;
    findOne(id: number): Promise<import("./entities/catalogo.entity").Catalogo>;
    update(id: number, updateCatalogoDto: UpdateCatalogoDto): Promise<import("./entities/catalogo.entity").Catalogo>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
