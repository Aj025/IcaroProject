import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export enum TenderStatusEnum {
  Pricing = 'Pricing',
  Tendering = 'Tendering',
  Issued = 'Issued',
  Won = 'Won',
  Lost = 'Lost',
  Withdrawn = 'Withdrawn',
}

export class CreateTenderDto {
  @IsString()
  client!: string;

  @IsString()
  job!: string;

  @IsDateString()
  received!: string;

  @IsOptional()
  @IsDateString()
  due?: string;

  @IsEnum(TenderStatusEnum)
  @IsOptional()
  status?: TenderStatusEnum;

  @IsString()
  @IsOptional()
  email?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  contractSum?: number;

  @IsString()
  @IsOptional()
  sourceEmailId?: string;
}
