import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { QuerySuppliersDto } from './dto/query-suppliers.dto.js';
import { MergeSuppliersDto } from './dto/merge-suppliers.dto.js';
import {
  SupplierListItemDto,
  SupplierDetailDto,
  PaginationMetaDto,
  type SupplierEntity,
} from './dto/supplier-response.dto.js';

@Injectable()
export class SuppliersService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async create(dto: CreateSupplierDto, userId: string) {
    const supplier = await this.db.supplier.create({
      data: {
        tenantId: process.env.TENANT_ID ?? 'default',
        company: dto.company.trim(),
        trade: dto.trade,
        contact: dto.contact.trim(),
        phone: dto.phone?.trim() ?? '',
        email: dto.email?.trim() ?? '',
        note: dto.note?.trim() ?? '',
        projectIds: dto.projectIds ?? [],
        usedBefore: dto.usedBefore ?? false,
      },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'Supplier',
        entityId: supplier.id,
        field: 'created',
        oldValue: null,
        newValue: JSON.stringify(supplier),
        changedById: userId,
      },
    });

    return SupplierDetailDto.fromEntity(supplier as unknown as SupplierEntity);
  }

  async findAll(query: QuerySuppliersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'company';
    const sortOrder = query.sortOrder ?? 'asc';

    const filters: Record<string, unknown> = {};

    if (!query.includeDeleted) {
      filters.isDeleted = false;
    }

    if (query.trade) {
      filters.trade = query.trade;
    }

    if (query.search) {
      filters.OR = [
        { company: { contains: query.search, mode: 'insensitive' } },
        { contact: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { note: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, suppliers] = await Promise.all([
      this.db.supplier.count({ where: filters as any }),
      this.db.supplier.findMany({
        where: filters as any,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data: (suppliers as unknown as SupplierEntity[]).map((s) =>
        SupplierListItemDto.fromEntity(s),
      ),
      meta: PaginationMetaDto.from(total, page, limit),
    };
  }

  async findOne(id: string) {
    const supplier = await this.db.supplier.findUnique({
      where: { id },
      include: { documents: true, dropboxLinks: true },
    });

    if (!supplier) throw new NotFoundException('Supplier not found');

    return SupplierDetailDto.fromEntity(supplier as unknown as SupplierEntity);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.db.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');
    if (existing.isDeleted) {
      throw new NotFoundException('Supplier is archived and cannot be edited');
    }

    const data: Record<string, unknown> = {};
    if (dto.company !== undefined) data.company = dto.company.trim();
    if (dto.trade !== undefined) data.trade = dto.trade;
    if (dto.contact !== undefined) data.contact = dto.contact.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.email !== undefined) data.email = dto.email.trim();
    if (dto.note !== undefined) data.note = dto.note.trim();
    if (dto.projectIds !== undefined) data.projectIds = dto.projectIds;
    if (dto.usedBefore !== undefined) data.usedBefore = dto.usedBefore;
    if (dto.ramsUrl !== undefined) data.ramsUrl = dto.ramsUrl;
    if (dto.ramsExpiry !== undefined) data.ramsExpiry = new Date(dto.ramsExpiry);
    if (dto.insuranceUrl !== undefined) data.insuranceUrl = dto.insuranceUrl;
    if (dto.insuranceExpiry !== undefined) data.insuranceExpiry = new Date(dto.insuranceExpiry);
    if (dto.cisStatus !== undefined) data.cisStatus = dto.cisStatus;
    if (dto.cisExpiry !== undefined) data.cisExpiry = new Date(dto.cisExpiry);

    const updated = await this.db.supplier.update({
      where: { id },
      data,
      include: { documents: true, dropboxLinks: true },
    });

    return SupplierDetailDto.fromEntity(updated as unknown as SupplierEntity);
  }

  async softDelete(id: string, userId: string) {
    const existing = await this.db.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');
    if (existing.isDeleted) {
      throw new ConflictException('Supplier is already archived');
    }

    if (existing.projectIds.length > 0) {
      throw new ConflictException({
        message: 'Cannot archive — supplier has active project links',
        projectCount: existing.projectIds.length,
      });
    }

    const updated = await this.db.supplier.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'Supplier',
        entityId: id,
        field: 'archived',
        oldValue: JSON.stringify(existing),
        newValue: null,
        changedById: userId,
      },
    });

    return SupplierDetailDto.fromEntity(updated as unknown as SupplierEntity);
  }

  async permanentDelete(id: string) {
    const existing = await this.db.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');
    if (!existing.isDeleted) {
      throw new ConflictException('Soft-delete the supplier first');
    }

    await this.db.auditLog.deleteMany({
      where: { entityId: id, entityType: 'Supplier' },
    });
    await this.db.supplier.delete({ where: { id } });
  }

  async restore(id: string, userId: string) {
    const existing = await this.db.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');
    if (!existing.isDeleted) {
      throw new ConflictException('Supplier is not archived');
    }

    const updated = await this.db.supplier.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'Supplier',
        entityId: id,
        field: 'restored',
        oldValue: null,
        newValue: JSON.stringify(updated),
        changedById: userId,
      },
    });

    return SupplierDetailDto.fromEntity(updated as unknown as SupplierEntity);
  }

  async merge(dto: MergeSuppliersDto, userId: string) {
    const { primaryId, duplicateIds } = dto;

    const primary = await this.db.supplier.findUnique({ where: { id: primaryId } });
    if (!primary) throw new NotFoundException('Primary supplier not found');
    if (primary.isDeleted) throw new ConflictException('Primary supplier is archived');

    const duplicates = await this.db.supplier.findMany({
      where: { id: { in: duplicateIds } },
      include: { documents: true, dropboxLinks: true },
    });

    if (duplicates.length !== duplicateIds.length) {
      throw new NotFoundException('One or more duplicate suppliers not found');
    }

    for (const dup of duplicates) {
      if (dup.isDeleted) throw new ConflictException(`Duplicate ${dup.id} is archived`);
    }

    const allProjectIds = new Set(primary.projectIds);
    let anyUsedBefore = primary.usedBefore;
    let allDocumentIds: string[] = [];
    let allLinkIds: string[] = [];

    for (const dup of duplicates) {
      for (const pid of dup.projectIds) allProjectIds.add(pid);
      if (dup.usedBefore) anyUsedBefore = true;
      allDocumentIds = [...allDocumentIds, ...dup.documents.map((d) => d.id)];
      allLinkIds = [...allLinkIds, ...dup.dropboxLinks.map((l) => l.id)];
    }

    await this.db.$transaction([
      this.db.supplierDocument.updateMany({
        where: { id: { in: allDocumentIds } },
        data: { supplierId: primaryId },
      }),
      this.db.dropboxLink.updateMany({
        where: { id: { in: allLinkIds } },
        data: { supplierId: primaryId },
      }),
      this.db.supplier.update({
        where: { id: primaryId },
        data: {
          projectIds: Array.from(allProjectIds),
          usedBefore: anyUsedBefore,
        },
      }),
      ...duplicates.map((dup) =>
        this.db.supplier.update({
          where: { id: dup.id },
          data: { isDeleted: true, deletedAt: new Date() },
        }),
      ),
    ]);

    await this.db.auditLog.create({
      data: {
        entityType: 'Supplier',
        entityId: primaryId,
        field: 'merged',
        oldValue: JSON.stringify({ duplicateIds }),
        newValue: JSON.stringify({ primaryId }),
        changedById: userId,
      },
    });

    return this.findOne(primaryId);
  }
}
