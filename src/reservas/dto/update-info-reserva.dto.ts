import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateInfoReservaDto {
  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsOptional()
  responsable_nombre?: string;

  @IsString()
  @IsOptional()
  responsable_telefono?: string;

  @IsString()
  @IsOptional()
  responsable_fecha_nacimiento?: string;

  @IsString()
  @IsOptional()
  responsable_cedula?: string;
}
