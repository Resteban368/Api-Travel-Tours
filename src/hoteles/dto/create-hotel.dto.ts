import {
  IsNotEmpty, IsOptional, IsString, IsArray, IsUrl,
  IsNumber, IsInt, Min, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HabitacionDto {
  @IsString({ message: 'tipo_cama debe ser un texto' })
  @IsNotEmpty({ message: 'tipo_cama es obligatorio' })
  tipo_cama: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  @Min(1, { message: 'cantidad debe ser al menos 1' })
  cantidad: number;

  @IsNumber({}, { message: 'precio debe ser un número' })
  @Min(0, { message: 'precio debe ser mayor o igual a 0' })
  precio: number;

  @IsArray()
  @IsString({ each: true, message: 'Cada imagen debe ser un texto' })
  @IsOptional()
  imagenes?: string[];

  @IsArray()
  @IsString({ each: true, message: 'Cada servicio debe ser un texto' })
  @IsOptional()
  servicios?: string[];

  @IsString({ message: 'observaciones debe ser un texto' })
  @IsOptional()
  observaciones?: string;
}

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  ciudad: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsArray()
  @IsString({ each: true, message: 'Cada imagen debe ser un texto' })
  @IsOptional()
  imagenes?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitacionDto)
  @IsOptional()
  habitaciones?: HabitacionDto[];
}
