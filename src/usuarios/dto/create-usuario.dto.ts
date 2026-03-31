import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';
import type { UserRole } from '../entities/usuario.entity';

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
}
