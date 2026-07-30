import {
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WIDGET_CATALOG_IDS,
  MIN_COL_SPAN,
  MAX_COL_SPAN,
  MIN_ROW_SPAN,
  MAX_ROW_SPAN,
  MAX_WIDGETS,
} from '../constants/widget-catalog.js';
import { NoDuplicateWidgetIdsDecorator } from './validators/no-duplicate-widget-ids.decorator.js';

const WIDGET_ID_LIST = [...WIDGET_CATALOG_IDS];

export class WidgetItemDto {
  @IsString()
  @IsIn(WIDGET_ID_LIST)
  id!: string;

  @IsInt()
  @Min(0)
  x!: number;

  @IsInt()
  @Min(0)
  y!: number;

  @IsInt()
  @Min(MIN_COL_SPAN)
  @Max(MAX_COL_SPAN)
  colSpan!: number;

  @IsInt()
  @Min(MIN_ROW_SPAN)
  @Max(MAX_ROW_SPAN)
  rowSpan!: number;
}

export class SaveLayoutDto {
  @IsArray()
  @ArrayMaxSize(MAX_WIDGETS)
  @ValidateNested({ each: true })
  @Type(() => WidgetItemDto)
  @NoDuplicateWidgetIdsDecorator()
  widgets!: WidgetItemDto[];
}
