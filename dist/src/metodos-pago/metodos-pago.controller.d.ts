import { MetodosPagoService } from './metodos-pago.service';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
export declare class MetodosPagoController {
    private readonly metodosPagoService;
    constructor(metodosPagoService: MetodosPagoService);
    create(createDto: CreateMetodoPagoDto): Promise<import("./entities/metodo-pago.entity").MetodoPago>;
    findAll(): Promise<import("./entities/metodo-pago.entity").MetodoPago[]>;
    findOne(id: number): Promise<import("./entities/metodo-pago.entity").MetodoPago>;
    update(id: number, updateDto: UpdateMetodoPagoDto): Promise<import("./entities/metodo-pago.entity").MetodoPago>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncVectors(): Promise<void>;
}
