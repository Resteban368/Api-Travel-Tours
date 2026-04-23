import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class AnalizarDocumentoDto {
  @IsString()
  @IsNotEmpty()
  imagen_base64: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'application/pdf'])
  mime_type: 'image/jpeg' | 'image/png' | 'application/pdf';
}
