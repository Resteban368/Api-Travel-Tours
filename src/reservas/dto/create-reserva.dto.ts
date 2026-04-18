import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TIPOS_DOCUMENTO, TipoDocumento } from '../../common/constants/tipo-documento';

export class IntegranteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsISO8601({}, { message: 'fecha_nacimiento debe ser una fecha válida (ISO 8601)' })
  @IsOptional()
  fecha_nacimiento?: string;

  @IsIn(TIPOS_DOCUMENTO, { message: `tipo_documento debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}` })
  @IsOptional()
  tipo_documento?: TipoDocumento;

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

  @IsISO8601({}, { message: 'fecha_salida debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty()
  fecha_salida: string;

  @IsISO8601({}, { message: 'fecha_llegada debe ser una fecha válida (ISO 8601)' })
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
