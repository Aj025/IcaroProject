import type { ReactNode } from 'react';

export type WidgetGroup = 'Financials' | 'Actions' | 'Tenders' | 'Projects' | 'Integrations';

export interface WidgetCatalogEntry {
  id: string;
  group: WidgetGroup;
  name: string;
  desc: string;
  requires?: string;
}

export const GRID_COLUMN_COUNT = 12;
export const GRID_ROW_HEIGHT_PX = 160;
export const COL_STEP = 0.25;
export const ROW_STEP = 0.25;
export const MIN_COL_SPAN = 2;
export const MIN_ROW_SPAN = 1;
export const MAX_COL_SPAN = 12;
export const MAX_ROW_SPAN = 6;
export const DEFAULT_COL_SPAN = 4;
export const DEFAULT_ROW_SPAN = 1;

export type WidgetSpan = {
  colSpan: number;
  rowSpan: number;
};

export interface WidgetInstance extends WidgetSpan {
  id: string;
}

function makeWidget(id: string, span: Partial<WidgetSpan> = {}): WidgetInstance {
  return {
    id,
    colSpan: span.colSpan ?? DEFAULT_COL_SPAN,
    rowSpan: span.rowSpan ?? DEFAULT_ROW_SPAN,
  };
}

export const WIDGET_GROUPS: WidgetGroup[] = [
  'Financials',
  'Actions',
  'Tenders',
  'Projects',
  'Integrations',
];

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    id: 'cash-at-risk',
    group: 'Financials',
    name: 'Cash at risk',
    desc: 'Total overdue client cash by project.',
  },
  {
    id: 'cash-position',
    group: 'Financials',
    name: 'Cash position',
    desc: 'Net position — owed to Icaro vs owed to subbies.',
  },
  {
    id: 'client-invoices',
    group: 'Financials',
    name: 'Outstanding client invoices',
    desc: 'Synced from Xero.',
  },
  {
    id: 'sub-invoices',
    group: 'Financials',
    name: 'Outstanding sub invoices',
    desc: 'Synced from Xero, after CIS.',
  },
  {
    id: 'ceo-actions',
    group: 'Actions',
    name: 'CEO action list',
    desc: 'Open items pulled from Brain Dump.',
  },
  {
    id: 'waiting-client',
    group: 'Actions',
    name: 'Waiting on client',
    desc: 'Items stuck on a client decision.',
  },
  {
    id: 'brain-dump',
    group: 'Actions',
    name: 'Brain dump',
    desc: 'Quick capture for anything unresolved.',
  },
  {
    id: 'tender-snapshot',
    group: 'Tenders',
    name: 'Tender snapshot',
    desc: 'Live tenders currently being priced.',
  },
  {
    id: 'live-projects',
    group: 'Projects',
    name: 'Live projects',
    desc: 'Budget and risk summary per project.',
  },
  {
    id: 'docusign',
    group: 'Integrations',
    name: 'DocuSign — awaiting signature',
    desc: 'Envelopes sent, not yet signed.',
  },
  {
    id: 'dropbox-revisions',
    group: 'Integrations',
    name: 'Dropbox — recent revisions',
    desc: 'New drawings synced from Dropbox.',
    requires: 'Dropbox',
  },
  {
    id: 'gmail-tenders',
    group: 'Integrations',
    name: 'Gmail — draft tenders',
    desc: 'Draft tenders created from parsed emails.',
    requires: 'Gmail parser (Phase 3)',
  },
];

export const DEFAULT_WIDGETS: WidgetInstance[] = [
  makeWidget('cash-at-risk', { colSpan: 4, rowSpan: 2 }),
  makeWidget('ceo-actions', { colSpan: 4, rowSpan: 2 }),
  makeWidget('waiting-client', { colSpan: 4, rowSpan: 1 }),
  makeWidget('client-invoices', { colSpan: 4, rowSpan: 2 }),
  makeWidget('sub-invoices', { colSpan: 4, rowSpan: 2 }),
  makeWidget('cash-position', { colSpan: 4, rowSpan: 1 }),
  makeWidget('tender-snapshot', { colSpan: 4, rowSpan: 1 }),
  makeWidget('docusign', { colSpan: 4, rowSpan: 1 }),
  makeWidget('brain-dump', { colSpan: 4, rowSpan: 2 }),
  makeWidget('live-projects', { colSpan: 8, rowSpan: 2 }),
];

export type WidgetBody = ReactNode;

export function getWidgetCatalogEntry(id: string): WidgetCatalogEntry | undefined {
  return WIDGET_CATALOG.find((w) => w.id === id);
}

const SYNC_BADGES: Record<string, string> = {
  'client-invoices': '↔ Xero',
  'sub-invoices': '↔ Xero',
  docusign: '↔ DocuSign',
  'dropbox-revisions': '↔ Dropbox',
};

export function getSyncBadge(id: string): string | null {
  return SYNC_BADGES[id] ?? null;
}
