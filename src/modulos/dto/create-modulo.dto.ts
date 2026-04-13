import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
