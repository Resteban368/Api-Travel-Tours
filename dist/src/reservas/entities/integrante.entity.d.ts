import { Reserva } from './reserva.entity';
export declare class IntegranteReserva {
    id: number;
    nombre: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
    reserva: Reserva;
}
