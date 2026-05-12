import { IsInt, IsPositive } from 'class-validator';

export class RecordatorioSaldoDto {
  @IsInt()
  @IsPositive()
  reserva_id: number;
}
