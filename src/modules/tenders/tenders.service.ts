import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTenderDto } from './dto/create-tender.dto.js';
import { UpdateTenderDto } from './dto/update-tender.dto.js';
import { UpdateTenderStatusDto } from './dto/update-tender-status.dto.js';
import { UpdateTenderEstimateDto } from './dto/update-tender-estimate.dto.js';
import {
  TenderResponseDto,
  type TenderEntity,
} from './dto/tender-response.dto.js';

export interface SnapshotItem {
  id: string;
  client: string;
  job: string;
  due: string | null;
  status: string;
  contractSum: number | null;
  isSigned: boolean;
  overdue: boolean;
  dueSoon: boolean;
}

@Injectable()
export class TendersService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async create(dto: CreateTenderDto, userId: string) {
    if (dto.sourceEmailId) {
      const existing = await this.db.tender.findUnique({
        where: { sourceEmailId: dto.sourceEmailId },
      });
      if (existing) {
        throw new ConflictException(
          'A tender with this sourceEmailId already exists',
        );
      }
    }

    const tender = await this.db.tender.create({
      data: {
        client: dto.client,
        job: dto.job,
        email: dto.email,
        received: new Date(dto.received),
        due: dto.due ? new Date(dto.due) : null,
        status: dto.status ?? 'Pricing',
        contractSum: dto.contractSum,
        sourceEmailId: dto.sourceEmailId,
        createdById: userId,
      },
    });

    return TenderResponseDto.fromEntity(tender, true);
  }

  async findAll(params: {
    status?: string;
    search?: string;
    includeDeleted?: boolean;
  }) {
    const filters: {
      isDeleted?: boolean;
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};
    const { status, search, includeDeleted } = params;

    if (!includeDeleted) {
      filters.isDeleted = false;
    }

    if (status) {
      filters.status = status;
    }

    if (search) {
      filters.OR = [
        { client: { contains: search, mode: 'insensitive' } },
        { job: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenders = await this.db.tender.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: filters as any,
      orderBy: { due: 'asc' },
      include: { assignedEstimator: true, createdBy: true },
    });

    return (tenders as unknown as TenderEntity[]).map((t) =>
      TenderResponseDto.fromEntity(t, true),
    );
  }

  async findOne(id: string) {
    const tender = await this.db.tender.findUnique({
      where: { id },
      include: { assignedEstimator: true, createdBy: true },
    });

    if (!tender) throw new NotFoundException('Tender not found');

    return TenderResponseDto.fromEntity(tender, true);
  }

  async update(id: string, dto: UpdateTenderDto) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');

    const updated = await this.db.tender.update({
      where: { id },
      data: {
        ...(dto.client !== undefined && { client: dto.client }),
        ...(dto.job !== undefined && { job: dto.job }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.due !== undefined && { due: new Date(dto.due) }),
      },
    });

    return TenderResponseDto.fromEntity(updated, true);
  }

  async updateStatus(
    id: string,
    dto: UpdateTenderStatusDto,
    changedById: string,
  ) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');

    const oldStatus: string = existing.status;
    const newStatus: string = dto.status;

    const updated = await this.db.tender.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        status: newStatus as any,
        isSigned: newStatus === 'Won' ? true : existing.isSigned,
      },
    });

    if (oldStatus !== newStatus) {
      await this.db.auditLog.create({
        data: {
          entityType: 'Tender',
          entityId: id,
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
          changedById,
        },
      });
    }

    return TenderResponseDto.fromEntity(updated, true);
  }

  async updateEstimate(
    id: string,
    dto: UpdateTenderEstimateDto,
    changedById: string,
  ) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');

    const oldValue = existing.contractSum?.toString() ?? null;

    const updated = await this.db.tender.update({
      where: { id },
      data: {
        contractSum: dto.contractSum,
        estimatedById: changedById,
        estimatedAt: new Date(),
      },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'Tender',
        entityId: id,
        field: 'contractSum',
        oldValue,
        newValue: dto.contractSum.toString(),
        changedById,
      },
    });

    return TenderResponseDto.fromEntity(updated, true);
  }

  async softDelete(id: string) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');

    if (existing.isSigned) {
      throw new ConflictException('Cannot delete — this tender has been won.');
    }

    if (existing.isDeleted) {
      throw new ConflictException('Tender is already deleted');
    }

    const updated = await this.db.tender.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return TenderResponseDto.fromEntity(updated, true);
  }

  async restore(id: string) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');
    if (!existing.isDeleted)
      throw new ConflictException('Tender is not deleted');

    const updated = await this.db.tender.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });

    return TenderResponseDto.fromEntity(updated, true);
  }

  async permanentDelete(id: string) {
    const existing = await this.db.tender.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tender not found');
    if (!existing.isDeleted) {
      throw new ConflictException('Soft-delete the tender first');
    }

    await this.db.auditLog.deleteMany({
      where: { entityId: id, entityType: 'Tender' },
    });
    await this.db.tender.delete({ where: { id } });
  }

  async getSnapshot(): Promise<SnapshotItem[]> {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const tenders = await this.db.tender.findMany({
      where: { isDeleted: false },
      orderBy: { due: 'asc' },
      take: 10,
    });

    return (tenders as unknown as TenderEntity[]).map((t) => {
      const dueDate = t.due ? new Date(t.due) : null;
      return {
        id: t.id,
        client: t.client,
        job: t.job,
        due: dueDate?.toISOString() ?? null,
        status: t.status,
        contractSum:
          t.contractSum != null
            ? typeof t.contractSum === 'object' && 'toNumber' in t.contractSum
              ? (t.contractSum as { toNumber(): number }).toNumber()
              : (t.contractSum as number)
            : null,
        isSigned: t.isSigned,
        overdue: dueDate != null && dueDate < now,
        dueSoon: dueDate != null && dueDate >= now && dueDate <= twoDaysFromNow,
      };
    });
  }

  async checkSourceEmailExists(
    sourceEmailId: string,
  ): Promise<{ exists: boolean }> {
    const tender = await this.db.tender.findUnique({
      where: { sourceEmailId },
    });
    return { exists: !!tender };
  }
}
