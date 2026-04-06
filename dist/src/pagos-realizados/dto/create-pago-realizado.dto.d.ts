export declare class CreatePagoRealizadoDto {
    chat_id: string;
    tipo_documento: string;
    monto: number;
    proveedor_comercio: string;
    nit: string;
    metodo_pago: string;
    referencia: string;
    fecha_documento: string;
    is_validated?: boolean;
    url_imagen?: string;
}
