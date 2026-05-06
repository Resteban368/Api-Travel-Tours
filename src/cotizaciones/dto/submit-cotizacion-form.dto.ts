import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsInt,
  IsPositive,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class SubmitCotizacionFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_completo: string;

  @IsEmail()
  @IsOptional()
  correo_electronico?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  detalles_plan?: string;

  @IsInt()
  @IsPositive()
  numero_pasajeros: number;

  @IsDateString()
  @IsOptional()
  fecha_salida?: string;

  @IsDateString()
  @IsOptional()
  fecha_regreso?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  origen?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  destino?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  edades_menores?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  especificaciones?: string;
}
