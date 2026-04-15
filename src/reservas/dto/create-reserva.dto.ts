import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class IntegranteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsIn(['cedula', 'pasaporte'])
  @IsOptional()
  tipo_documento?: 'cedula' | 'pasaporte';

  @IsString()
  @IsOptional()
  documento?: string;
}

export class VueloDto {
  @IsInt()
  @IsOptional()
  aerolinea_id?: number;

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
  fecha_salida: string;

  @IsString()
  @IsNotEmpty()
  fecha_llegada: string;

  @IsString()
  @IsNotEmpty()
  hora_salida: string;

  @IsString()
  @IsNotEmpty()
  hora_llegada: string;

  @IsString()
  @IsOptional()
  clase?: string;

  @IsNumber({}, { message: 'precio del vuelo debe ser un número' })
  @IsOptional()
  precio?: number;
}

export class CreateReservaDto {
  @IsString()
  @IsOptional()
  tipo_reserva?: string; // 'tour' | 'vuelos' | extensible — default: 'tour'

  // Requerido solo cuando tipo_reserva = 'tour'
  @ValidateIf((o) => o.tipo_reserva === 'tour')
  @IsInt()
  @IsNotEmpty()
  id_tour?: number;

  // Vuelos: requeridos cuando tipo_reserva = 'vuelos', opcionales para tours aéreos
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VueloDto)
  @IsOptional()
  vuelos?: VueloDto[];

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsEnum(['al dia', 'pendiente', 'cancelado'])
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  servicios_ids?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegranteDto)
  @IsOptional()
  integrantes?: IntegranteDto[];

  @IsNumber({}, { message: 'valor_total debe ser un número' })
  @IsOptional()
  valor_total?: number;

  @IsInt()
  @IsOptional()
  id_responsable?: number;
}
