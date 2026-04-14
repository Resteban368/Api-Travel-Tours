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

export class CreateTourDto {
  @IsNumber({}, { message: 'El ID del tour debe ser un número' })
  @IsNotEmpty({ message: 'El ID del tour es obligatorio' })
  id_tour: number;

  @IsString({ message: 'El nombre del tour debe ser un texto' })
  @IsNotEmpty({ message: 'el nombre del tour es obligatorio' })
  @MaxLength(500, {
    message: 'El nombre del tour no puede superar los 500 caracteres',
  })
  nombre_tour: string;

  @IsString({ message: 'La agencia debe ser un texto' })
  @IsOptional()
  agencia?: string;

  @IsString({
    message: 'La fecha de inicio debe ser una cadena de texto válida',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fecha_inicio: string;

  @IsString({ message: 'La fecha de fin debe ser una cadena de texto válida' })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  fecha_fin: string;

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
  @IsNotEmpty({ message: 'El link del PDF es obligatorio' })
  link_pdf: string;

  @IsArray({ message: 'Las inclusiones deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada inclusión debe ser un texto' })
  @ArrayMinSize(1, { message: 'El tour debe tener al menos una inclusión' })
  @IsNotEmpty({ message: 'El campo de inclusiones no puede estar vacío' })
  inclusions: string[];

  @IsArray({ message: 'Las exclusiones deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada exclusión debe ser un texto' })
  @ArrayMinSize(1, { message: 'El tour debe tener al menos una exclusión' })
  @IsNotEmpty({ message: 'El campo de exclusiones no puede estar vacío' })
  exclusions: string[];

  @IsArray({ message: 'El itinerario debe ser un arreglo' })
  @ArrayMinSize(1, {
    message: 'El tour debe tener al menos un día de itinerario',
  })
  @IsNotEmpty({ message: 'El campo de itinerario no puede estar vacío' })
  itinerary: any[];

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
  @IsNotEmpty({ message: 'La sede es obligatoria' })
  sede_id: string;
}
