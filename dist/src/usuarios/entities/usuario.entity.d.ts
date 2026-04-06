import { Rol } from './rol.entity';
export type UserRole = 'admin' | 'agente';
export declare class Usuario {
    id_usuario: number;
    nombre: string;
    email: string;
    password_hash: string;
    rol: Rol;
    rol_nombre: UserRole;
    activo: boolean;
    refresh_token_hash: string | null;
    fecha_creacion: Date;
    ultimo_acceso: Date | null;
}
