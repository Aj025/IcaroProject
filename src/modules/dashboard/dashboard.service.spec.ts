jest.mock('../../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    prisma: {
      dashboardLayout: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    },
  })),
}));

import { PrismaService } from '../../prisma/prisma.service.js';
import { DashboardService } from './dashboard.service.js';
import {
  DEFAULT_LAYOUT,
  type WidgetInstance,
} from './constants/default-layout.js';

const mockUser = {
  id: 'user-1',
  email: 'rob@icaroprojects.com',
  fullName: 'Rob',
  role: 'admin',
  permissions: {},
};

function mockEntity(widgets: WidgetInstance[], id = 'layout-1') {
  return {
    id,
    tenantId: 'default',
    userId: mockUser.id,
    widgets,
    createdAt: new Date('2026-07-27'),
    updatedAt: new Date('2026-07-27'),
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let db: any;

  beforeEach(() => {
    const prisma = new PrismaService();
    db = prisma.prisma;
    service = new DashboardService(prisma);
    jest.clearAllMocks();
  });

  describe('getLayout', () => {
    it('returns DEFAULT_LAYOUT when no saved row exists', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(null);
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
      expect(db.dashboardLayout.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_userId: { tenantId: 'default', userId: 'user-1' },
          },
        }),
      );
    });

    it('strips unknown widget IDs and logs a warning', async () => {
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation();
      db.dashboardLayout.findUnique.mockResolvedValue(
        mockEntity([
          { id: 'cash-at-risk', x: 0, y: 0, colSpan: 4, rowSpan: 2 },
          { id: 'bad-id', x: 0, y: 0, colSpan: 4, rowSpan: 2 },
        ]),
      );
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].id).toBe('cash-at-risk');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('bad-id'),
      );
      warnSpy.mockRestore();
    });

    it('returns DEFAULT_LAYOUT when stored widgets are all unknown', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(
        mockEntity([{ id: 'bad-1', x: 0, y: 0, colSpan: 4, rowSpan: 2 }]),
      );
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
    });

    it('returns saved empty array as-is (empty state)', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(mockEntity([]));
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual([]);
    });

    it('preserves known widgets and their spans', async () => {
      const widgets: WidgetInstance[] = [
        { id: 'cash-at-risk', x: 0, y: 0, colSpan: 6, rowSpan: 1 },
        { id: 'ceo-actions', x: 6, y: 0, colSpan: 6, rowSpan: 1 },
      ];
      db.dashboardLayout.findUnique.mockResolvedValue(mockEntity(widgets));
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual(widgets);
    });
  });

  describe('saveLayout', () => {
    it('upserts by composite tenantId_userId and returns saved widgets', async () => {
      const saved: WidgetInstance[] = [
        { id: 'cash-at-risk', x: 0, y: 0, colSpan: 6, rowSpan: 2 },
        { id: 'ceo-actions', x: 6, y: 0, colSpan: 6, rowSpan: 1 },
      ];
      db.dashboardLayout.upsert.mockResolvedValue(mockEntity(saved));
      db.auditLog.create.mockResolvedValue({});

      const result = await service.saveLayout(
        { widgets: saved } as any,
        mockUser,
      );

      expect(db.dashboardLayout.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_userId: { tenantId: 'default', userId: 'user-1' },
          },
        }),
      );
      expect(result.widgets).toEqual(saved);
    });

    it('writes an audit log entry with widgetCount', async () => {
      const saved: WidgetInstance[] = [
        { id: 'cash-at-risk', x: 0, y: 0, colSpan: 6, rowSpan: 2 },
      ];
      db.dashboardLayout.upsert.mockResolvedValue(mockEntity(saved, 'lay-9'));
      db.auditLog.create.mockResolvedValue({});

      await service.saveLayout({ widgets: saved } as any, mockUser);

      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'DashboardLayout',
            entityId: 'lay-9',
            field: 'widgets',
            newValue: JSON.stringify({ widgetCount: 1 }),
            changedById: 'user-1',
          }),
        }),
      );
    });
  });

  describe('resetLayout', () => {
    it('deletes an existing row and audits before.widgetCount', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(
        mockEntity([
          { id: 'cash-at-risk', x: 0, y: 0, colSpan: 4, rowSpan: 2 },
          { id: 'ceo-actions', x: 4, y: 0, colSpan: 4, rowSpan: 2 },
        ]),
      );
      db.dashboardLayout.delete.mockResolvedValue({});
      db.auditLog.create.mockResolvedValue({});

      const result = await service.resetLayout(mockUser);

      expect(db.dashboardLayout.delete).toHaveBeenCalledWith({
        where: { id: 'layout-1' },
      });
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            field: 'reset',
            oldValue: JSON.stringify({ widgetCount: 2 }),
          }),
        }),
      );
      expect(result.reset).toBe(true);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
      expect(result.message).toBe('Layout reset to defaults');
    });

    it('no-ops audit when no saved layout exists but still returns defaults', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(null);

      const result = await service.resetLayout(mockUser);

      expect(db.dashboardLayout.delete).not.toHaveBeenCalled();
      expect(db.auditLog.create).not.toHaveBeenCalled();
      expect(result.reset).toBe(true);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
    });
  });
});
