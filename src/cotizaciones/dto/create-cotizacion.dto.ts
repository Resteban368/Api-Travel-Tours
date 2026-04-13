import { IsString, IsInt, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';

export class CreateCotizacionDto {
  @IsString()
  chat_id: string;

  @IsString()
  nombre_completo: string;

  @IsEmail()
  @IsOptional()
  correo_electronico?: string;

  @IsString()
  detalles_plan: string;

  @IsInt()
  numero_pasajeros: number;

  @IsDateString()
  @IsOptional()
  fecha_salida?: string;

  @IsDateString()
  @IsOptional()
  fecha_regreso?: string;

  @IsString()
  @IsOptional()
  origen_destino?: string;

  @IsString()
  @IsOptional()
  edades_menores?: string;

  @IsString()
  @IsOptional()
  especificaciones?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  is_read?: boolean;
}
