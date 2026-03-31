import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
export declare class SedesController {
    private readonly sedesService;
    constructor(sedesService: SedesService);
    create(dto: CreateSedeDto): Promise<import("./entities/sede.entity").Sede>;
    findAll(): Promise<import("./entities/sede.entity").Sede[]>;
    findOne(id: number): Promise<import("./entities/sede.entity").Sede>;
    update(id: number, dto: UpdateSedeDto): Promise<import("./entities/sede.entity").Sede>;
    remove(id: number): Promise<void>;
    syncVectors(): Promise<void>;
}
