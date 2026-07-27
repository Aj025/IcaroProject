import { IsString, IsOptional, IsNumber, IsUrl, MaxLength } from 'class-validator';
import { DocumentCategory } from './upload-dropbox.dto.js';

export class StoreDropboxLinkDto {
  @IsUrl({ protocols: ['https'], host_whitelist: ['www.dropbox.com'] })
  dropboxUrl!: string;

  @IsString()
  fileName!: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  category!: DocumentCategory;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
