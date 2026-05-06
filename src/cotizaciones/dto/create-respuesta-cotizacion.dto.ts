import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class VueloDto {
  @IsEnum(['ida', 'vuelta'])
  tipo: 'ida' | 'vuelta';

  @IsInt()
  aerolinea_id: number;

  @IsString()
  @IsOptional()
  numero_vuelo?: string;

  @IsString()
  @IsNotEmpty()
  origen: string;

  @IsString()
  @IsNotEmpty()
  destino: string;

  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora_salida: string;

  @IsString()
  @IsNotEmpty()
  hora_llegada: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costo?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  numero_pasajeros?: number;
}

export class OpcionHotelDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  tipo_habitacion: string;

  @IsArray()
  @IsString({ each: true })
  que_incluye: string[];

  @IsString()
  @IsNotEmpty()
  fecha_entrada: string;

  @IsString()
  @IsNotEmpty()
  hora_entrada: string;

  @IsString()
  @IsNotEmpty()
  fecha_salida: string;

  @IsString()
  @IsNotEmpty()
  hora_salida: string;

  @IsNumber()
  @Min(0)
  precio_adulto: number;

  @IsNumber()
  @Min(0)
  precio_menor: number;

  @IsNumber()
  @Min(0)
  precio_total: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fotos?: string[];
}

export class AdicionalDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsBoolean()
  @IsOptional()
  es_seleccionable?: boolean;
}

export class CreateRespuestaCotizacionDto {
  @IsInt()
  @IsOptional()
  cotizacion_id?: number | null;

  @IsString()
  @IsNotEmpty()
  nombre_cliente: string;

  @IsString()
  @IsNotEmpty()
  telefono_cliente: string;

  @IsString()
  @IsNotEmpty()
  titulo_viaje: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imagenes_destino?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  items_incluidos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  items_no_incluidos?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VueloDto)
  vuelos: VueloDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpcionHotelDto)
  opciones_hotel: OpcionHotelDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdicionalDto)
  @IsOptional()
  adicionales?: AdicionalDto[];

  @IsString()
  @IsOptional()
  condiciones_generales?: string;
}

export class UpdateRespuestaCotizacionDto extends PartialType(CreateRespuestaCotizacionDto) {
  @IsBoolean()
  @IsOptional()
  anclada?: boolean;

  @IsBoolean()
  @IsOptional()
  es_publica?: boolean;
}
