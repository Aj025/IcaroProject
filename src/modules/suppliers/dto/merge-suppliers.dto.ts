import { IsString, IsArray, ArrayMinSize } from 'class-validator';

export class MergeSuppliersDto {
  @IsString()
  primaryId!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  duplicateIds!: string[];
}
