import { IsEmail, IsInt, IsOptional } from 'class-validator';

export class UpdateInfoReservaDto {
  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsInt()
  @IsOptional()
  id_responsable?: number;
}
