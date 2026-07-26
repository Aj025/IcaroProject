import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { PassportModule } from '@nestjs/passport';
import { validate } from './config/env.validation.js';
import configuration from './config/configuration.js';
import { PrismaService } from './prisma/prisma.service.js';
import { SupabaseJwtStrategy } from './modules/auth/supabase-jwt.strategy.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { HealthController } from './modules/health/health.controller.js';
import { TendersModule } from './modules/tenders/tenders.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TerminusModule,
    TendersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, SupabaseJwtStrategy, AuthGuard, PermissionsGuard],
  exports: [PrismaService],
})
export class AppModule {}
