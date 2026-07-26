import { IsString } from 'class-validator';

export class GmailIntakeDto {
  @IsString()
  sourceEmailId!: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;

  @IsString()
  receivedDate!: string;
}
