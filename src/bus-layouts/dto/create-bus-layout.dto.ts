import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsPositive,
  IsArray, ValidateNested, IsEnum, IsNumber, Min,
  registerDecorator, ValidationOptions, ValidationArguments,
  ValidatorConstraint, ValidatorConstraintInterface,
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

  @IsEnum(['normal', 'agente', 'conductor', 'vacio', 'baño', 'entrada'])
  tipo: TipoAsiento;
}

// ─────────────────────────────────────────────
// Constraint: validaciones de posicionamiento del bus
// ─────────────────────────────────────────────
@ValidatorConstraint({ name: 'busConfiguracionValida', async: false })
class BusConfiguracionValida implements ValidatorConstraintInterface {
  private mensaje = '';

  validate(asientos: AsientoLayoutDto[], args: ValidationArguments): boolean {
    const cfg = args.object as BusConfiguracionDto;
    const { columnas } = cfg;
    const colIzquierda = 0;
    const colDerecha = columnas - 1;
    const errores: string[] = [];

    for (const a of asientos) {
      // ── ENTRADA: solo columnas laterales ─────────────────────────────
      if (a.tipo === 'entrada') {
        if (a.columna !== colIzquierda && a.columna !== colDerecha) {
          errores.push(
            `Entrada en [fila=${a.fila}, col=${a.columna}] inválida: ` +
            `las entradas solo pueden estar en la columna 0 (izquierda) o ${colDerecha} (derecha).`,
          );
        }
      }

      // ── CONDUCTOR: solo esquinas de fila 0 ───────────────────────────
      if (a.tipo === 'conductor') {
        const esFilaFrente = a.fila === 0;
        const esEsquina = a.columna === colIzquierda || a.columna === colDerecha;
        if (!esFilaFrente || !esEsquina) {
          errores.push(
            `Conductor en [fila=${a.fila}, col=${a.columna}] inválido: ` +
            `el conductor debe estar en una esquina de la primera fila (fila 0, columna 0 o ${colDerecha}).`,
          );
        }
      }
    }

    // ── CONDUCTOR: máximo uno ─────────────────────────────────────────
    const conductores = asientos.filter((a) => a.tipo === 'conductor');
    if (conductores.length > 1) {
      errores.push('Solo puede existir un asiento de tipo conductor en el bus.');
    }

    if (errores.length > 0) {
      this.mensaje = errores.join(' | ');
      return false;
    }
    return true;
  }

  defaultMessage(): string {
    return this.mensaje || 'La configuración del bus contiene posiciones inválidas.';
  }
}

function ValidateBusAsientos(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: BusConfiguracionValida,
    });
  };
}

// ─────────────────────────────────────────────
export class BusConfiguracionDto {
  @IsInt()
  @IsPositive()
  filas: number;

  @IsInt()
  @IsPositive()
  columnas: number;

  @IsOptional()
  @IsNumber()
  pasillo_columna?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsientoLayoutDto)
  @ValidateBusAsientos({
    message: 'La configuración del bus contiene posiciones inválidas para conductor o entradas.',
  })
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
