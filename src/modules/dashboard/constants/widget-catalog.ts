export const MIN_COL_SPAN = 2;
export const MAX_COL_SPAN = 12;
export const MIN_ROW_SPAN = 1;
export const MAX_ROW_SPAN = 6;
export const DEFAULT_COL_SPAN = 4;
export const DEFAULT_ROW_SPAN = 1;
export const MAX_WIDGETS = 20;

export const WIDGET_CATALOG_IDS = [
  'cash-at-risk',
  'cash-position',
  'client-invoices',
  'sub-invoices',
  'ceo-actions',
  'waiting-client',
  'brain-dump',
  'tender-snapshot',
  'live-projects',
  'docusign',
  'dropbox-revisions',
  'gmail-tenders',
] as const;

export type WidgetId = (typeof WIDGET_CATALOG_IDS)[number];

export function isKnownWidgetId(id: string): id is WidgetId {
  return (WIDGET_CATALOG_IDS as readonly string[]).includes(id);
}
