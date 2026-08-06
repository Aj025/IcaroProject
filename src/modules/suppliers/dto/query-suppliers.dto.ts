import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TradeEnum } from './create-supplier.dto.js';

export class QuerySuppliersDto {
  @IsEnum(TradeEnum)
  @IsOptional()
  trade?: TradeEnum;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: 'company' | 'trade' | 'createdAt' = 'company';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
