import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class UpdateClienteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsIn(['cedula', 'pasaporte'])
  @IsOptional()
  tipo_documento?: 'cedula' | 'pasaporte';

  @IsString()
  @IsOptional()
  documento?: string;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}
