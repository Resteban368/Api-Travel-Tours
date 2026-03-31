import { PartialType } from '@nestjs/mapped-types';
import { CreatePagoRealizadoDto } from './create-pago-realizado.dto';

export class UpdatePagoRealizadoDto extends PartialType(CreatePagoRealizadoDto) {}
