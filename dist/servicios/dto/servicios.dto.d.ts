export declare class CreateServicioDto {
    nombre_servicio: string;
    costo?: number;
    descripcion: string;
    id_sede: number;
    activo?: boolean;
}
declare const UpdateServicioDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateServicioDto>>;
export declare class UpdateServicioDto extends UpdateServicioDto_base {
}
export {};
