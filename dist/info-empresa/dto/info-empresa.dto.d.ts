export declare class CreateInfoEmpresaDto {
    nombre: string;
    direccion_sede_principal: string;
    mision?: string;
    vision?: string;
    detalles_empresa?: string;
    horario_presencial?: string;
    horario_virtual?: string;
    redes_sociales?: any;
    nombre_gerente?: string;
    telefono?: string;
    correo?: string;
    pagina_web?: string;
}
declare const UpdateInfoEmpresaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateInfoEmpresaDto>>;
export declare class UpdateInfoEmpresaDto extends UpdateInfoEmpresaDto_base {
}
export {};
