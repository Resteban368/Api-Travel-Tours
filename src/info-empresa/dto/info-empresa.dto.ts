import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateInfoEmpresaDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString({ message: 'La dirección es obligatoria' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion_sede_principal: string;

  @IsString({ message: 'La misión debe ser un texto' })
  @IsOptional()
  mision?: string;

  @IsString({ message: 'La visión debe ser un texto' })
  @IsOptional()
  vision?: string;

  @IsString({ message: 'Los detalles de la empresa deben ser un texto' })
  @IsOptional()
  detalles_empresa?: string;

  @IsString({ message: 'El horario presencial debe ser un texto' })
  @IsOptional()
  horario_presencial?: string;

  @IsString({ message: 'El horario virtual debe ser un texto' })
  @IsOptional()
  horario_virtual?: string;

  @IsOptional()
  redes_sociales?: any; // Arreglo de objetos

  @IsString({ message: 'El nombre del gerente debe ser un texto' })
  @IsOptional()
  nombre_gerente?: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  telefono?: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsOptional()
  correo?: string;

  @IsString({ message: 'La página web debe ser un texto' })
  @IsOptional()
  pagina_web?: string;
}

export class UpdateInfoEmpresaDto extends PartialType(CreateInfoEmpresaDto) {}
