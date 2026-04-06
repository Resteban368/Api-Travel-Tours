import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
export declare class ReservasController {
    private readonly reservasService;
    constructor(reservasService: ReservasService);
    create(createReservaDto: CreateReservaDto): Promise<{
        id: number;
        id_reserva: string;
        correo: string;
        estado: string;
        fecha_creacion: Date;
        fecha_actualizacion: Date;
        tour: {
            id: number;
            nombre: string;
            fecha_inicio: Date | null;
            fecha_fin: Date | null;
            precio: number | null;
            es_promocion: boolean;
        } | null;
        servicios_adicionales: {
            id_servicio: number;
            nombre_servicio: string;
            costo: number | null;
            descripcion: string | null;
        }[];
        integrantes: {
            id: number;
            nombre: string;
            telefono: string | null;
            fecha_nacimiento: string | null;
        }[];
    }>;
    findAll(): Promise<{
        id: number;
        id_reserva: string;
        correo: string;
        estado: string;
        fecha_creacion: Date;
        fecha_actualizacion: Date;
        tour: {
            id: number;
            nombre: string;
            fecha_inicio: Date | null;
            fecha_fin: Date | null;
            precio: number | null;
            es_promocion: boolean;
        } | null;
        servicios_adicionales: {
            id_servicio: number;
            nombre_servicio: string;
            costo: number | null;
            descripcion: string | null;
        }[];
        integrantes: {
            id: number;
            nombre: string;
            telefono: string | null;
            fecha_nacimiento: string | null;
        }[];
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        id_reserva: string;
        correo: string;
        estado: string;
        fecha_creacion: Date;
        fecha_actualizacion: Date;
        tour: {
            id: number;
            nombre: string;
            fecha_inicio: Date | null;
            fecha_fin: Date | null;
            precio: number | null;
            es_promocion: boolean;
        } | null;
        servicios_adicionales: {
            id_servicio: number;
            nombre_servicio: string;
            costo: number | null;
            descripcion: string | null;
        }[];
        integrantes: {
            id: number;
            nombre: string;
            telefono: string | null;
            fecha_nacimiento: string | null;
        }[];
    }>;
}
