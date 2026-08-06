import { IsArray, ArrayMaxSize, IsString, IsIn } from 'class-validator';
import {
  WIDGET_CATALOG_IDS,
  MAX_WIDGETS,
} from '../constants/widget-catalog.js';
import { NoDuplicateStringsDecorator } from './validators/no-duplicate-strings.decorator.js';

const WIDGET_ID_LIST = [...WIDGET_CATALOG_IDS];

export class UpdateCatalogConfigDto {
  @IsArray()
  @ArrayMaxSize(MAX_WIDGETS)
  @IsString({ each: true })
  @IsIn(WIDGET_ID_LIST, { each: true })
  @NoDuplicateStringsDecorator()
  activeWidgetIds!: string[];
}
