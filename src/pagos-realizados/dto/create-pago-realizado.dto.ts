import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class CreatePagoRealizadoDto {
  @IsString({ message: 'El chat_id debe ser un texto' })
  @IsNotEmpty({ message: 'El chat_id es obligatorio' })
  chat_id: string;

  @IsString({ message: 'El tipo_documento debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo_documento es obligatorio' })
  tipo_documento: string;

  @IsNumber({}, { message: 'El monto debe ser un valor numérico' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  monto: number;

  @IsString({ message: 'El proveedor_comercio debe ser un texto' })
  @IsNotEmpty({ message: 'El proveedor_comercio es obligatorio' })
  proveedor_comercio: string;

  @IsString({ message: 'El nit debe ser un texto' })
  @IsNotEmpty({ message: 'El nit es obligatorio' })
  nit: string;

  @IsString({ message: 'El metodo_pago debe ser un texto' })
  @IsNotEmpty({ message: 'El metodo_pago es obligatorio' })
  metodo_pago: string;

  @IsString({ message: 'La referencia debe ser un texto' })
  @IsNotEmpty({ message: 'La referencia es obligatoria' })
  referencia: string;

  @IsString({ message: 'La fecha_documento debe ser un texto' })
  @IsNotEmpty({ message: 'La fecha_documento es obligatoria' })
  fecha_documento: string;

  @IsBoolean({ message: 'is_validated debe ser un valor booleano' })
  @IsOptional()
  is_validated?: boolean;

  @IsUrl({}, { message: 'url_imagen debe ser una URL válida' })
  @IsOptional()
  url_imagen?: string;
}
