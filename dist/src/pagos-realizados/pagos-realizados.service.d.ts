import { Repository } from 'typeorm';
import { PagoRealizado } from './entities/pago-realizado.entity';
import { AuditoriaPago } from './entities/auditoria-pago.entity';
import { CreatePagoRealizadoDto } from './dto/create-pago-realizado.dto';
import { UpdatePagoRealizadoDto } from './dto/update-pago-realizado.dto';
export declare class PagosRealizadosService {
    private readonly pagosRepository;
    private readonly auditoriaRepository;
    constructor(pagosRepository: Repository<PagoRealizado>, auditoriaRepository: Repository<AuditoriaPago>);
    create(createDto: CreatePagoRealizadoDto, realizadoPor?: string): Promise<PagoRealizado>;
    findAll(startDate?: string, endDate?: string): Promise<PagoRealizado[]>;
    findOne(id: number): Promise<PagoRealizado>;
    update(id: number, updateDto: UpdatePagoRealizadoDto, realizadoPor?: string): Promise<PagoRealizado>;
    remove(id: number, realizadoPor?: string): Promise<{
        message: string;
    }>;
    findAuditoria(idPago?: number, startDate?: string, endDate?: string): Promise<AuditoriaPago[]>;
}
