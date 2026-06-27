import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsIn,
  MaxLength,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  IsISO8601,
  ValidateNested,
  Min,
} from 'class-validator';
import { CreateTourSalidaDto, ItineraryDayDto, TourPrecioDto, TourPrecioGrupalDto } from './create-tour.dto';

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

  @IsString()
  @IsIn(['terrestre', 'pasadia', 'aereo', 'combinado'], {
    message: 'tipo_tour debe ser: terrestre, pasadia, aereo o combinado',
  })
  @IsOptional()
  tipo_tour?: string;

  @IsString({ message: 'La agencia debe ser un texto' })
  @IsOptional()
  agencia?: string;

  @IsString()
  @IsIn(['fecha_fija', 'multiples_fechas', 'permanente'], {
    message: 'disponibilidad_tipo debe ser: fecha_fija, multiples_fechas o permanente',
  })
  @IsOptional()
  disponibilidad_tipo?: 'fecha_fija' | 'multiples_fechas' | 'permanente';

  @IsISO8601({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  @IsOptional()
  fecha_inicio?: string;

  @IsISO8601({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
  @IsOptional()
  fecha_fin?: string;

  @IsArray({ message: 'salidas debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateTourSalidaDto)
  @IsOptional()
  salidas?: CreateTourSalidaDto[];

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
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  @IsOptional()
  itinerary?: ItineraryDayDto[];

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  descripcion?: string;

  @IsString({ message: 'Las recomendaciones deben ser un texto' })
  @IsOptional()
  recomendaciones?: string;

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
  @IsOptional()
  sede_id?: string;

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
