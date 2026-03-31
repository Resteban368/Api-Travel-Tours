import { IsString, IsInt, IsOptional, IsEmail, IsBoolean } from 'class-validator';

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
  numero_personas: number;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  is_read?: boolean;
}
