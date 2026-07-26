import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const profile = await this.prismaService.prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!profile.passwordHash) {
      throw new UnauthorizedException(
        'This account does not have a password set',
      );
    }

    const valid = await bcrypt.compare(password, profile.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: profile.id, email: profile.email };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
