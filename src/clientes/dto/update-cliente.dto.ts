import { IsString, IsOptional, IsEmail, IsIn, IsBoolean, IsISO8601 } from 'class-validator';
import { TIPOS_DOCUMENTO, TipoDocumento } from '../../common/constants/tipo-documento';

export class UpdateClienteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsISO8601({}, { message: 'fecha_nacimiento debe ser una fecha válida (ISO 8601)' })
  @IsOptional()
  fecha_nacimiento?: string;

  @IsIn(TIPOS_DOCUMENTO, { message: `tipo_documento debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}` })
  @IsOptional()
  tipo_documento?: TipoDocumento;

  @IsString()
  @IsOptional()
  documento?: string;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
