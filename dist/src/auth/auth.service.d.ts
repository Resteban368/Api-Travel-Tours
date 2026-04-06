import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly usuariosService;
    private readonly jwtService;
    private readonly configService;
    constructor(usuariosService: UsuariosService, jwtService: JwtService, configService: ConfigService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }>;
    refresh(rawRefreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    private generateTokenPair;
}
