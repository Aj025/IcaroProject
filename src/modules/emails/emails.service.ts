import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateAppEmailDto,
  UpdateAppEmailDto,
  AppEmailDto,
  type AppEmailEntity,
} from './dto/app-email.dto.js';

@Injectable()
export class EmailsService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  private get tenantId() {
    return process.env.TENANT_ID ?? 'default';
  }

  async findAll() {
    const emails = await this.db.appEmail.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: (emails as unknown as AppEmailEntity[]).map((e) =>
        AppEmailDto.fromEntity(e),
      ),
    };
  }

  async create(dto: CreateAppEmailDto, userId: string) {
    const email = await this.db.appEmail.create({
      data: {
        tenantId: this.tenantId,
        email: dto.email.trim(),
        type: dto.type?.trim() ?? '',
      },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'AppEmail',
        entityId: email.id,
        field: 'created',
        oldValue: null,
        newValue: JSON.stringify({ email: email.email, type: email.type }),
        changedById: userId,
      },
    });

    return AppEmailDto.fromEntity(email);
  }

  async update(id: string, dto: UpdateAppEmailDto, userId: string) {
    const existing = await this.db.appEmail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App email not found');

    const data: Record<string, unknown> = {};
    if (dto.email !== undefined) data.email = dto.email.trim();
    if (dto.type !== undefined) data.type = dto.type.trim();

    const updated = await this.db.appEmail.update({
      where: { id },
      data,
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'AppEmail',
        entityId: id,
        field: 'updated',
        oldValue: JSON.stringify({
          email: existing.email,
          type: existing.type,
        }),
        newValue: JSON.stringify({ email: updated.email, type: updated.type }),
        changedById: userId,
      },
    });

    return AppEmailDto.fromEntity(updated);
  }

  async delete(id: string, userId: string) {
    const existing = await this.db.appEmail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App email not found');

    await this.db.appEmail.delete({ where: { id } });

    await this.db.auditLog.create({
      data: {
        entityType: 'AppEmail',
        entityId: id,
        field: 'deleted',
        oldValue: JSON.stringify({
          email: existing.email,
          type: existing.type,
        }),
        newValue: null,
        changedById: userId,
      },
    });

    return { deleted: true };
  }
}
