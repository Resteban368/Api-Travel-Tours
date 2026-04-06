import type { UserRole } from '../entities/usuario.entity';
export declare class CreateUsuarioDto {
    nombre: string;
    email: string;
    password: string;
    rol?: UserRole;
    activo?: boolean;
}
