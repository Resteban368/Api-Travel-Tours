import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
export interface JwtPayload {
    sub: number;
    email: string;
    rol: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usuariosRepository;
    constructor(configService: ConfigService, usuariosRepository: Repository<Usuario>);
    validate(payload: JwtPayload): Promise<{
        id_usuario: number;
        email: string;
        rol: import("../../usuarios/entities/rol.entity").Rol;
        nombre: string;
    }>;
}
export {};
