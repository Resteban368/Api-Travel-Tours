import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { UserRole } from '../entities/usuario.entity';
import type { TipoPermiso } from '../../modulos/entities/permiso-agente.entity';

export class PermisoAgenteDto {
  @IsInt()
  modulo_id: number;

  @IsEnum(['lectura', 'completo'])
  tipo_permiso: TipoPermiso;
}

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['admin', 'agente'])
  @IsOptional()
  rol?: UserRole;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermisoAgenteDto)
  @IsOptional()
  permisos?: PermisoAgenteDto[];
}
