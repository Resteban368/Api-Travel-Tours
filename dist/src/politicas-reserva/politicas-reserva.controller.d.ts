import { PoliticasReservaService } from './politicas-reserva.service';
import { CreatePoliticaReservaDto, UpdatePoliticaReservaDto } from './dto/politicas-reserva.dto';
export declare class PoliticasReservaController {
    private readonly politicasReservaService;
    constructor(politicasReservaService: PoliticasReservaService);
    create(createDto: CreatePoliticaReservaDto): Promise<import("./entities/politica-reserva.entity").PoliticaReserva>;
    findAll(): Promise<import("./entities/politica-reserva.entity").PoliticaReserva[]>;
    findOne(id: number): Promise<import("./entities/politica-reserva.entity").PoliticaReserva>;
    update(id: number, updateDto: UpdatePoliticaReservaDto): Promise<import("./entities/politica-reserva.entity").PoliticaReserva>;
    remove(id: number): Promise<{
        message: string;
    }>;
    syncVectors(): Promise<void>;
}
