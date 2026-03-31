export declare class AuditoriaPago {
    id_auditoria: number;
    id_pago: number;
    accion: string;
    campo_modificado: string | null;
    valor_anterior: string | null;
    valor_nuevo: string | null;
    fecha_auditoria: Date;
    realizado_por: string | null;
}
