import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
export declare class AuthController {
    private readonly authService;
    private readonly usuariosService;
    constructor(authService: AuthService, usuariosService: UsuariosService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    me(req: any): any;
    register(dto: RegisterUserDto): Promise<Omit<import("../usuarios/entities/usuario.entity").Usuario, "password_hash" | "refresh_token_hash">>;
}
