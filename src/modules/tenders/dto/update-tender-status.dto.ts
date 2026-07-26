import { IsEnum } from 'class-validator';
import { TenderStatusEnum } from './create-tender.dto.js';

export class UpdateTenderStatusDto {
  @IsEnum(TenderStatusEnum)
  status!: TenderStatusEnum;
}
