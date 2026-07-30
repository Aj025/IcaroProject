import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import {
  DEFAULT_LAYOUT,
  type WidgetInstance,
} from './constants/default-layout.js';
import {
  WIDGET_CATALOG,
  isKnownWidgetId,
} from './constants/widget-catalog.js';
import type { SaveLayoutDto } from './dto/save-layout.dto.js';
import type { UpdateCatalogConfigDto } from './dto/update-catalog-config.dto.js';
import {
  LayoutResponseDto,
  ResetLayoutResponseDto,
  type CatalogEntry,
} from './dto/layout-response.dto.js';
import { CatalogResponseDto } from './dto/catalog-response.dto.js';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  private tenantId(): string {
    return process.env.TENANT_ID ?? 'default';
  }

  async getLayout(user: AuthenticatedUser): Promise<LayoutResponseDto> {
    const [existing, catalog] = await Promise.all([
      this.db.dashboardLayout.findUnique({
        where: {
          tenantId_userId: {
            tenantId: this.tenantId(),
            userId: user.id,
          },
        },
      }),
      this.buildCatalog(user),
    ]);

    if (!existing) {
      return LayoutResponseDto.fromWidgets(DEFAULT_LAYOUT, catalog);
    }

    const stored = (existing.widgets as unknown as WidgetInstance[]) ?? [];
    const cleaned = this.stripUnknownWidgets(stored, user.id);

    if (stored.length > 0 && cleaned.length === 0) {
      return LayoutResponseDto.fromWidgets(DEFAULT_LAYOUT, catalog);
    }

    return LayoutResponseDto.fromWidgets(cleaned, catalog);
  }

  async saveLayout(
    dto: SaveLayoutDto,
    user: AuthenticatedUser,
  ): Promise<LayoutResponseDto> {
    const widgets: WidgetInstance[] = dto.widgets.map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      colSpan: w.colSpan,
      rowSpan: w.rowSpan,
    }));

    const saved = await this.db.dashboardLayout.upsert({
      where: {
        tenantId_userId: {
          tenantId: this.tenantId(),
          userId: user.id,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      create: {
        tenantId: this.tenantId(),
        userId: user.id,
        widgets: widgets as any,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      update: { widgets: widgets as any },
    });

    await this.db.auditLog.create({
      data: {
        entityType: 'DashboardLayout',
        entityId: saved.id,
        field: 'widgets',
        oldValue: null,
        newValue: JSON.stringify({ widgetCount: widgets.length }),
        changedById: user.id,
      },
    });

    const catalog = await this.buildCatalog(user);
    return LayoutResponseDto.fromEntity(
      {
        ...saved,
        widgets: saved.widgets as unknown as WidgetInstance[],
      },
      catalog,
    );
  }

  async resetLayout(
    user: AuthenticatedUser,
  ): Promise<ResetLayoutResponseDto> {
    const existing = await this.db.dashboardLayout.findUnique({
      where: {
        tenantId_userId: {
          tenantId: this.tenantId(),
          userId: user.id,
        },
      },
    });

    if (existing) {
      const previousWidgets =
        (existing.widgets as unknown as WidgetInstance[]) ?? [];
      await this.db.dashboardLayout.delete({
        where: { id: existing.id },
      });
      await this.db.auditLog.create({
        data: {
          entityType: 'DashboardLayout',
          entityId: existing.id,
          field: 'reset',
          oldValue: JSON.stringify({ widgetCount: previousWidgets.length }),
          newValue: null,
          changedById: user.id,
        },
      });
    }

    const catalog = await this.buildCatalog(user);
    return ResetLayoutResponseDto.fromWidgets(DEFAULT_LAYOUT, catalog, true);
  }

  async getCatalog(user: AuthenticatedUser): Promise<CatalogResponseDto> {
    const catalog = await this.buildCatalog(user);
    return CatalogResponseDto.fromCatalog(catalog);
  }

  async updateCatalogConfig(
    dto: UpdateCatalogConfigDto,
    user: AuthenticatedUser,
  ): Promise<CatalogResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    await this.db.dashboardCatalogConfig.upsert({
      where: {
        tenantId_userId: {
          tenantId: this.tenantId(),
          userId: user.id,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      create: {
        tenantId: this.tenantId(),
        userId: user.id,
        activeWidgetIds: dto.activeWidgetIds as any,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      update: { activeWidgetIds: dto.activeWidgetIds as any },
    });

    const catalog = await this.buildCatalog(user);
    return CatalogResponseDto.fromCatalog(catalog);
  }

  async resetCatalogConfig(user: AuthenticatedUser): Promise<CatalogResponseDto> {
    await this.db.dashboardCatalogConfig.deleteMany({
      where: {
        tenantId: this.tenantId(),
        userId: user.id,
      },
    });

    const catalog = await this.buildCatalog(user);
    return CatalogResponseDto.fromCatalog(catalog);
  }

  private async buildCatalog(user: AuthenticatedUser): Promise<CatalogEntry[]> {
    const config = await this.db.dashboardCatalogConfig.findUnique({
      where: {
        tenantId_userId: {
          tenantId: this.tenantId(),
          userId: user.id,
        },
      },
    });

    const activeIds = config
      ? new Set<string>(config.activeWidgetIds as unknown as string[])
      : null;

    const connectedIntegrations = new Set<string>();
    const dropboxToken = await this.db.dropboxToken.findFirst({
      where: { tenantId: this.tenantId(), userId: user.id },
    });
    if (dropboxToken) {
      connectedIntegrations.add('Dropbox');
    }

    return WIDGET_CATALOG.map((entry) => ({
      ...entry,
      available: !entry.requires || connectedIntegrations.has(entry.requires),
      active: activeIds ? activeIds.has(entry.id) : true,
    }));
  }

  private stripUnknownWidgets(
    widgets: WidgetInstance[],
    userId: string,
  ): WidgetInstance[] {
    const unknownIds: string[] = [];
    const cleaned: WidgetInstance[] = [];

    for (const w of widgets) {
      if (w && typeof w.id === 'string' && isKnownWidgetId(w.id)) {
        cleaned.push({
          id: w.id,
          x: w.x,
          y: w.y,
          colSpan: w.colSpan,
          rowSpan: w.rowSpan,
        });
      } else if (w && typeof w.id === 'string') {
        unknownIds.push(w.id);
      }
    }

    if (unknownIds.length > 0) {
      this.logger.warn(
        `Layout for user ${userId} contained unknown widget IDs: [${unknownIds.join(', ')}]`,
      );
    }

    return cleaned;
  }
}
