import type { WidgetInstance } from '../constants/default-layout.js';

export interface DashboardLayoutEntity {
  id: string;
  tenantId: string;
  userId: string;
  widgets: WidgetInstance[];
  createdAt: Date;
  updatedAt: Date;
}

export class LayoutResponseDto {
  widgets: WidgetInstance[];

  static fromEntity(entity: DashboardLayoutEntity): LayoutResponseDto {
    const dto = new LayoutResponseDto();
    dto.widgets = entity.widgets ?? [];
    return dto;
  }

  static fromWidgets(widgets: WidgetInstance[]): LayoutResponseDto {
    const dto = new LayoutResponseDto();
    dto.widgets = widgets;
    return dto;
  }
}

export class ResetLayoutResponseDto extends LayoutResponseDto {
  reset: boolean;
  message: string;

  static fromWidgets(
    widgets: WidgetInstance[],
    reset = true,
  ): ResetLayoutResponseDto {
    const dto = new ResetLayoutResponseDto();
    dto.widgets = widgets;
    dto.reset = reset;
    dto.message = 'Layout reset to defaults';
    return dto;
  }
}
