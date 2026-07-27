import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SuppliersController } from './suppliers.controller.js';
import { SuppliersService } from './suppliers.service.js';
import { SuppliersComplianceService } from './suppliers-compliance.service.js';
import { SuppliersDropboxService } from './suppliers-dropbox.service.js';

@Module({
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    SuppliersComplianceService,
    SuppliersDropboxService,
    PrismaService,
  ],
  exports: [SuppliersService],
})
export class SuppliersModule {}
