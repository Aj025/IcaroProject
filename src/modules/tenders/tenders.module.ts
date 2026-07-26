import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ClaudeService } from '../../common/integrations/claude.service.js';
import { EmailService } from '../../common/integrations/email.service.js';
import { TendersController } from './tenders.controller.js';
import { TendersService } from './tenders.service.js';
import { TendersAutomationController } from './tenders-automation.controller.js';
import { TendersAutomationService } from './tenders-automation.service.js';

@Module({
  controllers: [TendersController, TendersAutomationController],
  providers: [
    TendersService,
    TendersAutomationService,
    PrismaService,
    ClaudeService,
    EmailService,
  ],
  exports: [TendersService],
})
export class TendersModule {}
