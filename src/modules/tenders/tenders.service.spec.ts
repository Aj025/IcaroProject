jest.mock('../../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    prisma: {
      tender: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      profile: { findUnique: jest.fn() },
    },
  })),
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TendersService } from './tenders.service.js';

const mockTenderEntity = (overrides: any = {}) => ({
  id: 'test-id',
  client: 'Test Client',
  job: 'Test job',
  received: new Date('2026-07-01'),
  due: new Date('2026-07-15'),
  status: 'Pricing',
  contractSum: null,
  isSigned: false,
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
  ...overrides,
});

describe('TendersService', () => {
  let service: TendersService;
  let db: any;

  beforeEach(() => {
    const prisma = new PrismaService();
    db = prisma.prisma;
    service = new TendersService(prisma);
    jest.clearAllMocks();
  });

  describe('softDelete', () => {
    it('blocks deletion when isSigned is true', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ isSigned: true }),
      );
      await expect(service.softDelete('test-id')).rejects.toThrow(
        ConflictException,
      );
      expect(db.tender.update).not.toHaveBeenCalled();
    });

    it('blocks deletion when already deleted', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ isDeleted: true }),
      );
      await expect(service.softDelete('test-id')).rejects.toThrow(
        ConflictException,
      );
      expect(db.tender.update).not.toHaveBeenCalled();
    });

    it('soft-deletes a tender not signed and not deleted', async () => {
      const entity = mockTenderEntity();
      db.tender.findUnique.mockResolvedValue(entity);
      db.tender.update.mockResolvedValue({
        ...entity,
        isDeleted: true,
        deletedAt: new Date(),
      });
      const result = await service.softDelete('test-id');
      expect(db.tender.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-id' },
          data: expect.objectContaining({ isDeleted: true }),
        }),
      );
      expect(result.deleted).toBe(true);
    });

    it('throws NotFoundException for non-existent tender', async () => {
      db.tender.findUnique.mockResolvedValue(null);
      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('restores a deleted tender', async () => {
      const entity = mockTenderEntity({
        isDeleted: true,
        deletedAt: new Date(),
      });
      db.tender.findUnique.mockResolvedValue(entity);
      db.tender.update.mockResolvedValue({
        ...entity,
        isDeleted: false,
        deletedAt: null,
      });
      const result = await service.restore('test-id');
      expect(result.deleted).toBe(false);
    });

    it('throws when restoring a non-deleted tender', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ isDeleted: false }),
      );
      await expect(service.restore('test-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    it('sets isSigned to true when status becomes Won', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ status: 'Pricing' }),
      );
      db.tender.update.mockResolvedValue(
        mockTenderEntity({ status: 'Won', isSigned: true }),
      );
      db.auditLog.create.mockResolvedValue({});
      await service.updateStatus('test-id', { status: 'Won' as any }, 'user-1');
      expect(db.tender.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Won', isSigned: true }),
        }),
      );
    });

    it('creates an audit log entry on status change', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ status: 'Pricing' }),
      );
      db.tender.update.mockResolvedValue(
        mockTenderEntity({ status: 'Won', isSigned: true }),
      );
      db.auditLog.create.mockResolvedValue({});
      await service.updateStatus('test-id', { status: 'Won' as any }, 'user-1');
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            field: 'status',
            oldValue: 'Pricing',
            newValue: 'Won',
          }),
        }),
      );
    });

    it('does not create audit log when status unchanged', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ status: 'Pricing' }),
      );
      db.tender.update.mockResolvedValue(mockTenderEntity());
      await service.updateStatus(
        'test-id',
        { status: 'Pricing' as any },
        'user-1',
      );
      expect(db.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('updateEstimate', () => {
    it('creates audit log with old and new values', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ contractSum: { toString: () => '100000' } }),
      );
      db.tender.update.mockResolvedValue(
        mockTenderEntity({ contractSum: { toString: () => '150000' } }),
      );
      db.auditLog.create.mockResolvedValue({});
      await service.updateEstimate(
        'test-id',
        { contractSum: 150000 },
        'user-1',
      );
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            field: 'contractSum',
            oldValue: '100000',
            newValue: '150000',
          }),
        }),
      );
    });
  });

  describe('getSnapshot', () => {
    it('marks overdue when due date is in the past', async () => {
      const past = new Date(Date.now() - 86400000);
      db.tender.findMany.mockResolvedValue([mockTenderEntity({ due: past })]);
      const result = await service.getSnapshot();
      expect(result[0].overdue).toBe(true);
      expect(result[0].dueSoon).toBe(false);
    });

    it('marks dueSoon when due date is within 2 days', async () => {
      const future = new Date(Date.now() + 86400000);
      db.tender.findMany.mockResolvedValue([mockTenderEntity({ due: future })]);
      const result = await service.getSnapshot();
      expect(result[0].overdue).toBe(false);
      expect(result[0].dueSoon).toBe(true);
    });

    it('handles boundary: exactly 2 days from now is dueSoon', async () => {
      const exactlyTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      db.tender.findMany.mockResolvedValue([
        mockTenderEntity({ due: exactlyTwoDays }),
      ]);
      const result = await service.getSnapshot();
      expect(result[0].dueSoon).toBe(true);
    });

    it('marks neither for far future dates', async () => {
      const future = new Date(Date.now() + 7 * 86400000);
      db.tender.findMany.mockResolvedValue([mockTenderEntity({ due: future })]);
      const result = await service.getSnapshot();
      expect(result[0].overdue).toBe(false);
      expect(result[0].dueSoon).toBe(false);
    });
  });

  describe('create', () => {
    it('creates a tender with provided data', async () => {
      db.tender.create.mockResolvedValue(
        mockTenderEntity({ client: 'New Client', job: 'New job' }),
      );
      const result = await service.create(
        {
          client: 'New Client',
          job: 'New job',
          received: '2026-07-01T00:00:00.000Z',
          due: '2026-07-15T00:00:00.000Z',
        },
        'user-1',
      );
      expect(result.client).toBe('New Client');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when tender does not exist', async () => {
      db.tender.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the tender when it exists', async () => {
      db.tender.findUnique.mockResolvedValue(mockTenderEntity());
      const result = await service.findOne('test-id');
      expect(result.id).toBe('test-id');
    });
  });

  describe('permanentDelete', () => {
    it('throws if tender is not soft-deleted first', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ isDeleted: false }),
      );
      await expect(service.permanentDelete('test-id')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deletes audit logs and the tender', async () => {
      db.tender.findUnique.mockResolvedValue(
        mockTenderEntity({ isDeleted: true }),
      );
      db.auditLog.deleteMany.mockResolvedValue({ count: 0 });
      db.tender.delete.mockResolvedValue({});
      await service.permanentDelete('test-id');
      expect(db.auditLog.deleteMany).toHaveBeenCalledWith({
        where: { entityId: 'test-id', entityType: 'Tender' },
      });
      expect(db.tender.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });
  });

  describe('findAll', () => {
    it('filters by status', async () => {
      db.tender.findMany.mockResolvedValue([
        mockTenderEntity({ status: 'Pricing' }),
      ]);
      const result = await service.findAll({ status: 'Pricing' });
      expect(db.tender.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'Pricing' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('excludes deleted by default', async () => {
      db.tender.findMany.mockResolvedValue([]);
      await service.findAll({});
      expect(db.tender.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDeleted: false }),
        }),
      );
    });
  });
});
