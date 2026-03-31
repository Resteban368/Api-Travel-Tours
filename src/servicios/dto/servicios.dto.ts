import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateServicioDto {
  @IsString({ message: 'El nombre del servicio debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
  nombre_servicio: string;

  @IsNumber({}, { message: 'El costo debe ser un número' })
  @IsOptional()
  costo?: number;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsNumber({}, { message: 'El ID de la sede debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  id_sede: number;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

export class UpdateServicioDto extends PartialType(CreateServicioDto) {}
