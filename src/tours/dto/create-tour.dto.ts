import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  IsISO8601,
  IsInt,
  IsIn,
  Min,
  ValidateNested,
} from 'class-validator';

export class TourPrecioGrupalDto {
  @IsInt({ message: 'min_personas debe ser un número entero' })
  @Min(1, { message: 'min_personas debe ser al menos 1' })
  min_personas: number;

  @IsInt({ message: 'max_personas debe ser un número entero' })
  @Min(1, { message: 'max_personas debe ser al menos 1' })
  max_personas: number;

  @IsNumber({}, { message: 'precio debe ser un número' })
  @Min(0, { message: 'precio debe ser mayor o igual a 0' })
  precio: number;

  @IsString({ message: 'descripcion debe ser un texto' })
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class TourPrecioDto {
  @IsString({ message: 'La descripción del precio debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del precio es obligatoria' })
  descripcion: string;

  @IsInt({ message: 'edad_min debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_min?: number;

  @IsInt({ message: 'edad_max debe ser un entero' })
  @Min(0)
  @IsOptional()
  edad_max?: number;

  @IsString({ message: 'punto_partida debe ser un texto' })
  @IsOptional()
  punto_partida?: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  precio: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class ItineraryDayDto {
  @IsInt({ message: 'dia_numero debe ser un número entero' })
  @IsNotEmpty()
  dia_numero: number;

  @IsString({ message: 'El título del día debe ser un texto' })
  @IsNotEmpty({ message: 'El título del día es obligatorio' })
  titulo: string;

  @IsString({ message: 'La descripción del día debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del día es obligatoria' })
  descripcion: string;
}

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

  @IsString()
  @IsIn(['terrestre', 'pasadia', 'aereo', 'combinado'], {
    message: 'tipo_tour debe ser: terrestre, pasadia, aereo o combinado',
  })
  @IsNotEmpty({ message: 'El tipo de tour es obligatorio' })
  tipo_tour: string;

  @IsString({ message: 'La agencia debe ser un texto' })
  @IsOptional()
  agencia?: string;

  @IsISO8601({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fecha_inicio: string;

  @IsISO8601({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
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

  @IsArray({ message: 'imagenes debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada imagen debe ser un texto' })
  @IsOptional()
  imagenes?: string[];

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
  @ArrayMinSize(1, { message: 'El tour debe tener al menos un día de itinerario' })
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  itinerary: ItineraryDayDto[];

  @IsNumber({}, { message: 'El campo cupos debe ser un número entero' })
  @IsOptional()
  cupos?: number;

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

  @IsArray({ message: 'precios debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => TourPrecioDto)
  @IsOptional()
  precios?: TourPrecioDto[];

  @IsArray({ message: 'bus_layout_ids debe ser un arreglo' })
  @IsInt({ each: true, message: 'Cada bus_layout_id debe ser un número entero' })
  @IsOptional()
  bus_layout_ids?: number[];

  @IsString()
  @IsIn(['individual', 'grupal', 'pareja'], {
    message: 'modo_precio debe ser: individual, grupal o pareja',
  })
  @IsOptional()
  modo_precio?: 'individual' | 'grupal' | 'pareja';

  @IsArray({ message: 'precios_grupales debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => TourPrecioGrupalDto)
  @IsOptional()
  precios_grupales?: TourPrecioGrupalDto[];
}
