import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class VerificarCedulaDto {
  @IsString()
  @IsNotEmpty()
  cedula: string;
}

export class ConfirmarSeleccionDto {
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  asientos: string[];
}

export class HoldAsientosDto {
  @IsArray()
  @IsString({ each: true })
  asientos: string[];
}
