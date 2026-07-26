import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

interface RequestWithUser extends Request {
  user: { id: string; email: string };
}

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const base = await super.canActivate(context);
    if (!base) return false;

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const profile = await this.prismaService.prisma.profile.findUnique({
      where: { id: request.user.id },
    });
    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    request.user = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      permissions: profile.permissions,
    } as unknown as RequestWithUser['user'];

    return true;
  }
}
