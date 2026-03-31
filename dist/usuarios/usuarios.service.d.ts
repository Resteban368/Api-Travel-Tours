import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsuariosService {
    private readonly usuariosRepository;
    constructor(usuariosRepository: Repository<Usuario>);
    findByEmail(email: string): Promise<Usuario | null>;
    findById(id: number): Promise<Usuario | null>;
    updateRefreshToken(id: number, tokenHash: string | null): Promise<void>;
    updateUltimoAcceso(id: number): Promise<void>;
    create(dto: CreateUsuarioDto): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>>;
    findAll(): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>[]>;
    findOne(id: number): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>>;
    update(id: number, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>>;
    remove(id: number): Promise<{
        message: string;
    }>;
    private sanitize;
}
