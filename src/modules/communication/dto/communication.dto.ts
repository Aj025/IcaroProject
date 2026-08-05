import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EMAIL_TEMPLATE_KEYS } from '../constants/default-email-templates.js';

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;
}

export class EmailTemplateKeyParam {
  @IsIn(EMAIL_TEMPLATE_KEYS)
  key!: string;
}

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsOptional()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsIn(EMAIL_TEMPLATE_KEYS)
  templateKey?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;
}
