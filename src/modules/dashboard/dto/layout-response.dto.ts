import type { WidgetInstance } from '../constants/default-layout.js';
import type { WidgetCatalogEntry } from '../constants/widget-catalog.js';

export interface DashboardLayoutEntity {
  id: string;
  tenantId: string;
  userId: string;
  widgets: WidgetInstance[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogEntry extends WidgetCatalogEntry {
  available: boolean;
  active: boolean;
}

export class LayoutResponseDto {
  widgets: WidgetInstance[];
  catalog: CatalogEntry[];

  static fromEntity(
    entity: DashboardLayoutEntity,
    catalog: CatalogEntry[],
  ): LayoutResponseDto {
    const dto = new LayoutResponseDto();
    dto.widgets = entity.widgets ?? [];
    dto.catalog = catalog;
    return dto;
  }

  static fromWidgets(
    widgets: WidgetInstance[],
    catalog: CatalogEntry[],
  ): LayoutResponseDto {
    const dto = new LayoutResponseDto();
    dto.widgets = widgets;
    dto.catalog = catalog;
    return dto;
  }
}

export class ResetLayoutResponseDto extends LayoutResponseDto {
  reset: boolean;
  message: string;

  static fromWidgets(
    widgets: WidgetInstance[],
    catalog: CatalogEntry[],
    reset = true,
  ): ResetLayoutResponseDto {
    const dto = new ResetLayoutResponseDto();
    dto.widgets = widgets;
    dto.catalog = catalog;
    dto.reset = reset;
    dto.message = 'Layout reset to defaults';
    return dto;
  }
}
