import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificacionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  usuario_id?: number | null;
}
