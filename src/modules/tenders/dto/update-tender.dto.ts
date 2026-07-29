import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateTenderDto {
  @IsString()
  @IsOptional()
  client?: string;

  @IsString()
  @IsOptional()
  job?: string;

  @IsDateString()
  @IsOptional()
  received?: string;

  @IsDateString()
  @IsOptional()
  due?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
