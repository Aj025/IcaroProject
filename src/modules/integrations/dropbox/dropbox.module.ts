import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { DropboxController } from './dropbox.controller.js';
import { DropboxService } from './dropbox.service.js';

@Module({
  controllers: [DropboxController],
  providers: [DropboxService, PrismaService],
  exports: [DropboxService],
})
export class DropboxModule {}
