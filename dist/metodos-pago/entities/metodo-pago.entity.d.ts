export declare class MetodoPago {
    id_metodo_pago: number;
    nombre_metodo: string;
    tipo_pago: string;
    tipo_cuenta: string | null;
    numero_metodo: string;
    titular_cuenta: string;
    activo: boolean;
    fecha_creacion: Date;
}
