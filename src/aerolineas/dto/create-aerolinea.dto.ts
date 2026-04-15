import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAerolineaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  codigo_iata: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  pais?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
