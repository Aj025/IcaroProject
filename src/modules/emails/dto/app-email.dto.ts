import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export interface AppEmailEntity {
  id: string;
  tenantId: string;
  email: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateAppEmailDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  type?: string;
}

export class UpdateAppEmailDto {
  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  type?: string;
}

export class AppEmailDto {
  id: string = '';
  email: string = '';
  type: string = '';
  createdAt: string = '';
  updatedAt: string = '';

  static fromEntity(entity: AppEmailEntity): AppEmailDto {
    const dto = new AppEmailDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.type = entity.type;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
