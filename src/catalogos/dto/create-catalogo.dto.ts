import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateCatalogoDto {
  @IsNumber({}, { message: 'El ID de la sede debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  id_sede: number;

  @IsString({ message: 'El nombre del catálogo debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del catálogo es obligatorio' })
  nombre_catalogo: string;

  @IsString({ message: 'La URL del archivo debe ser un texto' })
  @IsNotEmpty({ message: 'La URL del archivo es obligatoria' })
  url_archivo: string;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}
