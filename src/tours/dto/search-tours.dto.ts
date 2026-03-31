import { IsArray, IsNumber, ArrayMinSize, Max } from 'class-validator';

export class SearchToursDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  embedding: number[];
}
