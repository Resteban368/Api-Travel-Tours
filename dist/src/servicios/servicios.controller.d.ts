import { ServiciosService } from './servicios.service';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicios.dto';
export declare class ServiciosController {
    private readonly serviciosService;
    constructor(serviciosService: ServiciosService);
    create(createDto: CreateServicioDto): Promise<import("./entities/servicio.entity").Servicio>;
    findAll(): Promise<import("./entities/servicio.entity").Servicio[]>;
    findOne(id: number): Promise<import("./entities/servicio.entity").Servicio>;
    update(id: number, updateDto: UpdateServicioDto): Promise<import("./entities/servicio.entity").Servicio>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncVectors(): Promise<void>;
}
