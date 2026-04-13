import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEstadoReservaDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado es requerido' })
  estado: string;
}
