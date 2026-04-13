import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

export class UpdateTourDto {
  @IsNumber({}, { message: 'El ID del tour debe ser un número' })
  @IsNotEmpty({ message: 'El ID del tour es obligatorio' })
  id_tour: number;

  @IsString({ message: 'El nombre del tour debe ser un texto' })
  @IsOptional()
  @MaxLength(500, {
    message: 'El nombre del tour no puede superar los 500 caracteres',
  })
  nombre_tour?: string;

  @IsString({ message: 'La agencia debe ser un texto' })
  @IsOptional()
  agencia?: string;

  @IsString({
    message: 'La fecha de inicio debe ser una cadena de texto válida',
  })
  @IsOptional()
  fecha_inicio?: string;

  @IsString({ message: 'La fecha de fin debe ser una cadena de texto válida' })
  @IsOptional()
  fecha_fin?: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsOptional()
  precio?: number;

  @IsBoolean({ message: 'El campo precio_por_pareja debe ser un booleano' })
  @IsOptional()
  precio_por_pareja?: boolean;

  @IsString({ message: 'El punto de partida debe ser un texto' })
  @IsOptional()
  punto_partida?: string;

  @IsString({ message: 'La hora de partida debe ser un texto' })
  @IsOptional()
  hora_partida?: string;

  @IsString({ message: 'La llegada debe ser un texto' })
  @IsOptional()
  llegada?: string;

  @IsString({ message: 'La URL de la imagen debe ser un texto' })
  @IsOptional()
  url_imagen?: string;

  @IsString({ message: 'El link del PDF debe ser un texto' })
  @IsOptional()
  link_pdf?: string;

  @IsArray({ message: 'Las inclusiones deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada inclusión debe ser un texto' })
  @IsOptional()
  inclusions?: string[];

  @IsArray({ message: 'Las exclusiones deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada exclusión debe ser un texto' })
  @IsOptional()
  exclusions?: string[];

  @IsArray({ message: 'El itinerario debe ser un arreglo' })
  @IsOptional()
  itinerary?: any[];

  @IsBoolean({ message: 'El campo estado debe ser un booleano' })
  @IsOptional()
  estado?: boolean;

  @IsBoolean({ message: 'El campo es_promocion debe ser un booleano' })
  @IsOptional()
  es_promocion?: boolean;

  @IsBoolean({ message: 'El campo is_active debe ser un booleano' })
  @IsOptional()
  is_active?: boolean;

  @IsBoolean({ message: 'El campo es_borrador debe ser un booleano' })
  @IsOptional()
  es_borrador?: boolean;

  @IsString({ message: 'El ID de la sede debe ser un texto' })
  @IsOptional()
  sede_id?: string;
}
