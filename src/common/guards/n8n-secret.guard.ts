import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class N8nSecretGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-n8n-secret'] as string | undefined;
    const expected = this.configService.get<string>('N8N_WEBHOOK_SECRET');

    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid n8n secret');
    }

    return true;
  }
}
