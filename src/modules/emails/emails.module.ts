import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailsController } from './emails.controller.js';
import { EmailsService } from './emails.service.js';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, PrismaService],
  exports: [EmailsService],
})
export class EmailsModule {}
