export declare class CreateTourDto {
    id_tour: number;
    nombre_tour: string;
    agencia?: string;
    fecha_inicio: string;
    fecha_fin: string;
    precio?: number;
    punto_partida?: string;
    hora_partida?: string;
    llegada?: string;
    url_imagen?: string;
    link_pdf: string;
    inclusions: string[];
    exclusions: string[];
    itinerary: any[];
    estado?: boolean;
    es_promocion?: boolean;
    is_active?: boolean;
    es_borrador?: boolean;
    sede_id: string;
}
