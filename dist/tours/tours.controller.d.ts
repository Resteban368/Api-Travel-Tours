import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { SearchToursDto } from './dto/search-tours.dto';
export declare class ToursController {
    private readonly toursService;
    constructor(toursService: ToursService);
    create(dto: CreateTourDto): Promise<import("./entities/tours-maestro.entity").ToursMaestro>;
    findAll(): Promise<import("./entities/tours-maestro.entity").ToursMaestro[]>;
    searchByEmbedding(dto: SearchToursDto, limit: number): Promise<(import("./entities/n8n-vector.entity").N8nVector & {
        similarity?: number;
    })[]>;
    findOne(id: number): Promise<import("./entities/tours-maestro.entity").ToursMaestro>;
    update(id: number, dto: UpdateTourDto): Promise<import("./entities/tours-maestro.entity").ToursMaestro>;
}
