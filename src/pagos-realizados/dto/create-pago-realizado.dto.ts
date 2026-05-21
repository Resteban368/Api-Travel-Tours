import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUrl, IsInt, IsIn, Min, IsISO8601, ValidateIf } from 'class-validator';

export class CreatePagoRealizadoDto {
  @IsString({ message: 'El chat_id debe ser un texto' })
  @IsOptional()
  chat_id?: string;

  @IsString()
  @IsIn(['reserva', 'proveedor', 'servicio'], { message: 'entidad_tipo debe ser reserva, proveedor o servicio' })
  @IsNotEmpty()
  entidad_tipo: string;

  @IsNumber({}, { message: 'El monto debe ser un valor numérico' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  monto: number;

  @IsString({ message: 'El metodo_pago debe ser un texto' })
  @IsNotEmpty({ message: 'El metodo_pago es obligatorio' })
  metodo_pago: string;

  @IsString({ message: 'La referencia debe ser un texto' })
  @IsOptional()
  referencia?: string;

  @IsISO8601({}, { message: 'fecha_documento debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha_documento es obligatoria' })
  fecha_documento: string;

  @IsBoolean({ message: 'is_validated debe ser un valor booleano' })
  @IsOptional()
  is_validated?: boolean;

  @IsBoolean({ message: 'is_rechazado debe ser un valor booleano' })
  @IsOptional()
  is_rechazado?: boolean;

  @IsString({ message: 'motivo_rechazo debe ser un texto' })
  @IsOptional()
  motivo_rechazo?: string;

  @ValidateIf((o) => o.url_imagen != null && o.url_imagen !== '')
  @IsUrl({}, { message: 'url_imagen debe ser una URL válida' })
  @IsOptional()
  url_imagen?: string;

  @IsInt({ message: 'reserva_id debe ser un número entero' })
  @IsOptional()
  reserva_id?: number;

  @IsInt({ message: 'proveedor_id debe ser un número entero' })
  @IsOptional()
  proveedor_id?: number;

  @IsString()
  @IsOptional()
  concepto?: string;

  @IsString()
  @IsOptional()
  cliente_nombre?: string;

  @IsString()
  @IsOptional()
  cliente_identificacion?: string;
}
