import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  SUPABASE_URL?: string;

  @IsString()
  SUPABASE_JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @IsString()
  N8N_WEBHOOK_SECRET!: string;

  @IsString()
  @IsOptional()
  CLAUDE_API_KEY?: string;

  @IsString()
  @IsOptional()
  TRANSACTIONAL_EMAIL_API_KEY?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
