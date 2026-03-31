import { PagosRealizadosService } from './pagos-realizados.service';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';
export declare class PagosRealizadosController {
    private readonly pagosService;
    constructor(pagosService: PagosRealizadosService);
    create(createDto: CreatePagoRealizadoDto, req: any): Promise<import("./entities/pago-realizado.entity").PagoRealizado>;
    findAll(startDate?: string, endDate?: string): Promise<import("./entities/pago-realizado.entity").PagoRealizado[]>;
    findAuditoria(idPagoRaw?: string, startDate?: string, endDate?: string): Promise<import("./entities/auditoria-pago.entity").AuditoriaPago[]>;
    findOne(id: number): Promise<import("./entities/pago-realizado.entity").PagoRealizado>;
    update(id: number, updateDto: UpdatePagoRealizadoDto, req: any): Promise<import("./entities/pago-realizado.entity").PagoRealizado>;
    remove(id: number, req: any): Promise<{
        message: string;
    }>;
}
