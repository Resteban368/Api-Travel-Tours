import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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
}

export class CreateReservaDto {
  @IsInt()
  @IsNotEmpty()
  id_tour: number;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsEnum(['al dia', 'pendiente', 'cancelado'])
  @IsOptional()
  estado?: string;

  // IDs de los servicios adicionales a agregar
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  servicios_ids?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegranteDto)
  @IsOptional()
  integrantes?: IntegranteDto[];
}
