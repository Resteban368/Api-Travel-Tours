import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsNumber,
  IsIn, IsISO8601, Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Moneda } from '../entities/pago-proveedor.entity';

const MONEDAS: Moneda[] = ['COP', 'USD', 'EUR'];

export class CreatePagoProveedorDto {
  @IsInt()
  proveedor_id: number;

  @IsInt()
  @IsOptional()
  tour_id?: number | null;

  @IsInt()
  @IsOptional()
  hotel_id?: number | null;

  @IsString()
  @IsNotEmpty()
  concepto: string;

  @IsNumber({}, { message: 'monto debe ser un número' })
  @Min(0)
  monto: number;

  @IsIn(MONEDAS, { message: `moneda debe ser uno de: ${MONEDAS.join(', ')}` })
  @IsOptional()
  moneda?: Moneda;

  @IsISO8601({}, { message: 'fecha_pago debe ser una fecha válida (ISO 8601)' })
  fecha_pago: string;

  @IsInt()
  @IsOptional()
  metodo_pago_id?: number | null;

  @IsString()
  @IsOptional()
  comprobante_url?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdatePagoProveedorDto extends PartialType(CreatePagoProveedorDto) {}
