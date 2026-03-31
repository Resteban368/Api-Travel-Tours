import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFaqDto {
  @IsString({ message: 'La pregunta debe ser un texto' })
  @IsNotEmpty({ message: 'La pregunta es obligatoria' })
  pregunta: string;

  @IsString({ message: 'La respuesta debe ser un texto' })
  @IsNotEmpty({ message: 'La respuesta es obligatoria' })
  respuesta: string;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}
