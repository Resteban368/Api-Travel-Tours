export declare class ToursMaestro {
    id: number;
    id_tour: number | null;
    nombre_tour: string;
    agencia: string | null;
    fecha_inicio: Date | null;
    fecha_fin: Date | null;
    precio: number | null;
    punto_partida: string | null;
    hora_partida: string | null;
    llegada: string | null;
    url_imagen: string | null;
    link_pdf: string | null;
    inclusions: string[] | null;
    exclusions: string[] | null;
    itinerary: any[] | null;
    estado: boolean;
    es_promocion: boolean;
    is_active: boolean;
    es_borrador: boolean;
    sede_id: string | null;
    createdAt: Date;
}
