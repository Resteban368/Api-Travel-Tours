import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
export declare class RolesController {
    private readonly rolesRepository;
    constructor(rolesRepository: Repository<Rol>);
    create(dto: {
        nombre: string;
        descripcion?: string;
    }): Promise<Rol>;
    findAll(): Promise<Rol[]>;
    findOne(id: number): Promise<Rol | null>;
    update(id: number, dto: Partial<Rol>): Promise<Rol | null>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
