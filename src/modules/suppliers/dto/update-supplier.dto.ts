import {
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { TradeEnum } from './create-supplier.dto.js';

export class UpdateSupplierDto {
  @IsString()
  @MaxLength(160)
  @IsOptional()
  company?: string;

  @IsEnum(TradeEnum)
  @IsOptional()
  trade?: TradeEnum;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  contact?: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  phone?: string;

  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(600)
  @IsOptional()
  note?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  projectIds?: string[];

  @IsBoolean()
  @IsOptional()
  usedBefore?: boolean;

  @IsString()
  @IsOptional()
  ramsUrl?: string;

  @IsString()
  @IsOptional()
  ramsExpiry?: string;

  @IsString()
  @IsOptional()
  insuranceUrl?: string;

  @IsString()
  @IsOptional()
  insuranceExpiry?: string;

  @IsString()
  @IsOptional()
  cisStatus?: string;

  @IsString()
  @IsOptional()
  cisExpiry?: string;
}
