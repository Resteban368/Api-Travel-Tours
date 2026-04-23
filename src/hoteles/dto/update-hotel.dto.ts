import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelDto } from './create-hotel.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
