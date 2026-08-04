import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CommunicationController } from './communication.controller.js';
import { CommunicationService } from './communication.service.js';

@Module({
  controllers: [CommunicationController],
  providers: [CommunicationService, PrismaService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
