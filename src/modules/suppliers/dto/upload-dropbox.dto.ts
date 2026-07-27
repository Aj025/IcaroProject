import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum DocumentCategory {
  RAMS = 'RAMS',
  INSURANCE = 'INSURANCE',
  CIS = 'CIS',
  METHOD_STATEMENT = 'METHOD_STATEMENT',
  OTHER = 'OTHER',
}

export class UploadDropboxDto {
  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsString()
  @IsOptional()
  description?: string;
}
