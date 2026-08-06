jest.mock('../../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    prisma: {
      dashboardLayout: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      dashboardCatalogConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      dropboxToken: {
        findFirst: jest.fn(),
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

function mockCatalogConfig(activeWidgetIds: string[], id = 'config-1') {
  return {
    id,
    tenantId: 'default',
    userId: mockUser.id,
    activeWidgetIds,
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
    db.dropboxToken.findFirst.mockResolvedValue(null);
  });

  describe('getLayout', () => {
    it('returns DEFAULT_LAYOUT when no saved row exists', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(null);
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
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
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].id).toBe('cash-at-risk');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bad-id'));
      warnSpy.mockRestore();
    });

    it('returns DEFAULT_LAYOUT when stored widgets are all unknown', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(
        mockEntity([{ id: 'bad-1', x: 0, y: 0, colSpan: 4, rowSpan: 2 }]),
      );
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
    });

    it('returns saved empty array as-is (empty state)', async () => {
      db.dashboardLayout.findUnique.mockResolvedValue(mockEntity([]));
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
      const result = await service.getLayout(mockUser);
      expect(result.widgets).toEqual([]);
    });

    it('preserves known widgets and their spans', async () => {
      const widgets: WidgetInstance[] = [
        { id: 'cash-at-risk', x: 0, y: 0, colSpan: 6, rowSpan: 1 },
        { id: 'ceo-actions', x: 6, y: 0, colSpan: 6, rowSpan: 1 },
      ];
      db.dashboardLayout.findUnique.mockResolvedValue(mockEntity(widgets));
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
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
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);

      const result = await service.saveLayout({ widgets: saved }, mockUser);

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
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);

      await service.saveLayout({ widgets: saved }, mockUser);

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
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);

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
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);

      const result = await service.resetLayout(mockUser);

      expect(db.dashboardLayout.delete).not.toHaveBeenCalled();
      expect(db.auditLog.create).not.toHaveBeenCalled();
      expect(result.reset).toBe(true);
      expect(result.widgets).toEqual(DEFAULT_LAYOUT);
    });
  });

  describe('getCatalog', () => {
    it('returns all widgets active=true when no config row exists', async () => {
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);
      const result = await service.getCatalog(mockUser);
      for (const entry of result.catalog) {
        expect(entry.active).toBe(true);
      }
      expect(result.catalog.length).toBeGreaterThan(0);
    });

    it('returns active=true only for widget IDs in config', async () => {
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(
        mockCatalogConfig(['cash-at-risk', 'ceo-actions']),
      );
      const result = await service.getCatalog(mockUser);
      const cash = result.catalog.find((e) => e.id === 'cash-at-risk');
      const ceo = result.catalog.find((e) => e.id === 'ceo-actions');
      const other = result.catalog.find((e) => e.id === 'live-projects');
      expect(cash?.active).toBe(true);
      expect(ceo?.active).toBe(true);
      expect(other?.active).toBe(false);
    });
  });

  describe('updateCatalogConfig', () => {
    it('upserts the config and returns catalog', async () => {
      const activeIds = ['cash-at-risk', 'ceo-actions', 'brain-dump'];
      db.dashboardCatalogConfig.upsert.mockResolvedValue(
        mockCatalogConfig(activeIds),
      );
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(
        mockCatalogConfig(activeIds),
      );

      const result = await service.updateCatalogConfig(
        { activeWidgetIds: activeIds },
        mockUser,
      );

      expect(db.dashboardCatalogConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_userId: { tenantId: 'default', userId: 'user-1' },
          },
          create: expect.objectContaining({
            activeWidgetIds: activeIds,
          }),
          update: expect.objectContaining({
            activeWidgetIds: activeIds,
          }),
        }),
      );
      expect(result.catalog.length).toBeGreaterThan(0);
    });
  });

  describe('resetCatalogConfig', () => {
    it('deletes the config row and returns all widgets active', async () => {
      db.dashboardCatalogConfig.deleteMany.mockResolvedValue({ count: 1 });
      db.dashboardCatalogConfig.findUnique.mockResolvedValue(null);

      const result = await service.resetCatalogConfig(mockUser);

      expect(db.dashboardCatalogConfig.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 'default', userId: 'user-1' },
      });
      for (const entry of result.catalog) {
        expect(entry.active).toBe(true);
      }
    });
  });
});
