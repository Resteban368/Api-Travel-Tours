import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePoliticaReservaDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsString({ message: 'El tipo de política debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de política es obligatorio' })
  tipo_politica: string; // 'reserva', 'cancelacion'

  @IsBoolean({ message: 'El campo activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

export class UpdatePoliticaReservaDto extends PartialType(CreatePoliticaReservaDto) {}
