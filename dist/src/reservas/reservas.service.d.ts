import { Repository } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
export declare class ReservasService {
    private readonly reservaRepository;
    private readonly servicioRepository;
    private readonly tourRepository;
    constructor(reservaRepository: Repository<Reserva>, servicioRepository: Repository<Servicio>, tourRepository: Repository<ToursMaestro>);
    create(dto: CreateReservaDto): Promise<{
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
    private transformResponse;
}
