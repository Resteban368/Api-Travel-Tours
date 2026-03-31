import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMetodoPagoDto {
  @IsString({ message: 'El nombre del método debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del método es obligatorio' })
  nombre_metodo: string;

  @IsString({ message: 'El tipo de pago debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de pago es obligatorio' })
  tipo_pago: string;

  @IsString({ message: 'El tipo de cuenta debe ser un texto' })
  @IsOptional()
  tipo_cuenta?: string;

  @IsString({ message: 'El número del método de pago debe ser un texto' })
  @IsNotEmpty({ message: 'El número del método de pago es obligatorio' })
  numero_metodo: string;

  @IsString({ message: 'El nombre del titular debe ser un texto' })
  @IsNotEmpty({ message: 'El campo "Titular de la cuenta" es obligatorio' })
  titular_cuenta: string;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}
