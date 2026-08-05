import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CommunicationController } from './communication.controller.js';
import { CommunicationService } from './communication.service.js';
import { MailService } from './mail.service.js';

@Module({
  controllers: [CommunicationController],
  providers: [CommunicationService, MailService, PrismaService],
  exports: [CommunicationService, MailService],
})
export class CommunicationModule {}
