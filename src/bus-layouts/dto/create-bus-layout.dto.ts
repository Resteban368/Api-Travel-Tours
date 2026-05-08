import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsPositive,
  IsArray, ValidateNested, IsEnum, IsNumber, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { TipoAsiento } from '../entities/bus-layout.entity';

export class AsientoLayoutDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsInt()
  @Min(0)
  fila: number;

  @IsInt()
  @Min(0)
  columna: number;

  @IsEnum(['normal', 'agente', 'conductor', 'vacio', 'baño'])
  tipo: TipoAsiento;
}

export class BusConfiguracionDto {
  @IsInt()
  @IsPositive()
  filas: number;

  @IsInt()
  @IsPositive()
  columnas: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsientoLayoutDto)
  asientos: AsientoLayoutDto[];
}

export class CreateBusLayoutDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @ValidateNested()
  @Type(() => BusConfiguracionDto)
  configuracion: BusConfiguracionDto;
}

export class UpdateBusLayoutDto extends PartialType(CreateBusLayoutDto) {
  @IsOptional()
  activo?: boolean;
}
