import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Cuerpo que envía la página web
export class CreateOpinionPublicaDto {
  @Transform(trim)
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(40, { message: 'El nombre no puede superar 40 caracteres' })
  nombre: string;

  @Transform(trim)
  @IsString({ message: 'El plan debe ser un texto' })
  @IsOptional()
  @MaxLength(80, { message: 'El plan no puede superar 80 caracteres' })
  plan?: string;

  @Transform(trim)
  @IsString({ message: 'La opinión debe ser un texto' })
  @IsNotEmpty({ message: 'La opinión es obligatoria' })
  @MaxLength(500, { message: 'La opinión no puede superar 500 caracteres' })
  opinion: string;

  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación debe estar entre 1 y 5' })
  @Max(5, { message: 'La calificación debe estar entre 1 y 5' })
  @IsOptional()
  calificacion?: number;
}

export class UpdateOpinionDto {
  @IsBoolean({ message: 'aprobada debe ser un booleano' })
  aprobada: boolean;
}
