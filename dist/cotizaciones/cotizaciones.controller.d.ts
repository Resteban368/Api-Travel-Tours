import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
export declare class CotizacionesController {
    private readonly cotizacionesService;
    constructor(cotizacionesService: CotizacionesService);
    create(createCotizacionDto: CreateCotizacionDto): Promise<import("./entities/cotizacion.entity").Cotizacion>;
    findAll(): Promise<import("./entities/cotizacion.entity").Cotizacion[]>;
    findOne(id: number): Promise<import("./entities/cotizacion.entity").Cotizacion>;
    update(id: number, updateCotizacionDto: UpdateCotizacionDto): Promise<import("./entities/cotizacion.entity").Cotizacion>;
    remove(id: number): Promise<import("./entities/cotizacion.entity").Cotizacion>;
}
