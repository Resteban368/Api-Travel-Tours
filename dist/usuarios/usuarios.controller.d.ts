import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsuariosController {
    private readonly usuariosService;
    constructor(usuariosService: UsuariosService);
    create(dto: CreateUsuarioDto): Promise<Omit<import("./entities/usuario.entity").Usuario, "password_hash" | "refresh_token_hash">>;
    findAll(): Promise<Omit<import("./entities/usuario.entity").Usuario, "password_hash" | "refresh_token_hash">[]>;
    findOne(id: number): Promise<Omit<import("./entities/usuario.entity").Usuario, "password_hash" | "refresh_token_hash">>;
    update(id: number, dto: UpdateUsuarioDto): Promise<Omit<import("./entities/usuario.entity").Usuario, "password_hash" | "refresh_token_hash">>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
