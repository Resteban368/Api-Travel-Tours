import { IsString, MaxLength, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateSedeDto {
  @IsString({ message: 'El nombre de la sede debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la sede es obligatorio' })
  nombre_sede: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  telefono: string;

  @IsUrl({}, { message: 'El link de mapa debe ser una URL válida' })
  @IsNotEmpty({ message: 'El link de mapa es obligatorio' })
  link_map: string;

  @IsNotEmpty({ message: 'El estado activo es obligatorio' })
  is_active: boolean;
}
