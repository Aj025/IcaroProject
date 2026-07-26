import { IsNumber, Min } from 'class-validator';

export class UpdateTenderEstimateDto {
  @IsNumber()
  @Min(0)
  contractSum!: number;
}
