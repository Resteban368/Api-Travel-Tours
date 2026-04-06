import type { UserRole } from '../../usuarios/entities/usuario.entity';
export declare class RegisterUserDto {
    nombre: string;
    email: string;
    password: string;
    rol?: UserRole;
}
