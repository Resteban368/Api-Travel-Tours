import { IsString, IsNotEmpty, IsOptional, IsIn, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TipoProveedor } from '../entities/proveedor.entity';

const TIPOS_PROVEEDOR: TipoProveedor[] = ['hotel', 'aerolinea', 'transporte', 'seguro', 'otro'];

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsIn(TIPOS_PROVEEDOR, { message: `tipo debe ser uno de: ${TIPOS_PROVEEDOR.join(', ')}` })
  tipo: TipoProveedor;

  @IsString()
  @IsOptional()
  nit?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  banco?: string;

  @IsString()
  @IsOptional()
  numero_cuenta?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {}
