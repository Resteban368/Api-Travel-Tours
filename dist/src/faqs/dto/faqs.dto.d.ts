export declare class CreateFaqDto {
    pregunta: string;
    respuesta: string;
    activo?: boolean;
}
declare const UpdateFaqDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateFaqDto>>;
export declare class UpdateFaqDto extends UpdateFaqDto_base {
}
export {};
