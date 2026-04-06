import { ToursMaestro } from '../../tours/entities/tours-maestro.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';
import { IntegranteReserva } from './integrante.entity';
export declare class Reserva {
    id: number;
    id_reserva: string;
    correo: string;
    estado: string;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    tour: ToursMaestro;
    servicios: Servicio[];
    integrantes: IntegranteReserva[];
}
