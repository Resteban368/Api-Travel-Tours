import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QuerySaldosDto {
  @IsOptional()
  @IsNumberString()
  tour_id?: string;

  @IsOptional()
  @IsString()
  responsable?: string; // nombre o documento

  @IsOptional()
  @IsString()
  id_reserva?: string;

  @IsOptional()
  @IsString()
  tour_nombre?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  sin_recordatorio_reciente?: string;
}
