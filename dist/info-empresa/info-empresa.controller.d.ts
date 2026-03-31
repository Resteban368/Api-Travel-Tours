import { InfoEmpresaService } from './info-empresa.service';
import { CreateInfoEmpresaDto, UpdateInfoEmpresaDto } from './dto/info-empresa.dto';
export declare class InfoEmpresaController {
    private readonly infoEmpresaService;
    constructor(infoEmpresaService: InfoEmpresaService);
    create(createDto: CreateInfoEmpresaDto): Promise<import("./entities/info-empresa.entity").InfoEmpresa>;
    findAll(): Promise<import("./entities/info-empresa.entity").InfoEmpresa[]>;
    findOne(id: number): Promise<import("./entities/info-empresa.entity").InfoEmpresa>;
    update(id: number, updateDto: UpdateInfoEmpresaDto): Promise<import("./entities/info-empresa.entity").InfoEmpresa>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncVectors(): Promise<void>;
}
