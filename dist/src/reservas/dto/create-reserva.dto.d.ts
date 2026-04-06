export declare class IntegranteDto {
    nombre: string;
    telefono?: string;
    fecha_nacimiento?: string;
}
export declare class CreateReservaDto {
    id_tour: number;
    correo: string;
    estado?: string;
    servicios_ids?: number[];
    integrantes?: IntegranteDto[];
}
