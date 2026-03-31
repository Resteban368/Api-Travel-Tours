export declare class PagoRealizado {
    id_pago: number;
    chat_id: string;
    fecha_creacion: Date;
    tipo_documento: string;
    monto: number;
    proveedor_comercio: string;
    nit: string;
    metodo_pago: string;
    referencia: string;
    fecha_documento: string;
    is_validated: boolean;
    url_imagen: string | null;
}
