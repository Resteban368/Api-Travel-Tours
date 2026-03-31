export declare class CreatePoliticaReservaDto {
    titulo: string;
    descripcion: string;
    tipo_politica: string;
    activo?: boolean;
}
declare const UpdatePoliticaReservaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePoliticaReservaDto>>;
export declare class UpdatePoliticaReservaDto extends UpdatePoliticaReservaDto_base {
}
export {};
