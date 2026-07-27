import {
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum TradeEnum {
  Groundworks = 'Groundworks',
  Electrical = 'Electrical',
  Plumbing = 'Plumbing',
  Roofing = 'Roofing',
  Joinery = 'Joinery',
  Plastering = 'Plastering',
  Other = 'Other',
}

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  company!: string;

  @IsEnum(TradeEnum)
  trade!: TradeEnum;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  contact!: string;

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
}
