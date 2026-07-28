import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prismaService.prisma.profile.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const profile = await this.prismaService.prisma.profile.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        fullName: dto.fullName ?? null,
        passwordHash,
        role: 'estimator',
        permissions: [],
      },
    });

    const payload = { sub: profile.id, email: profile.email };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

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
