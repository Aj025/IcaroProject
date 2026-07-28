export const MIN_COL_SPAN = 2;
export const MAX_COL_SPAN = 12;
export const MIN_ROW_SPAN = 1;
export const MAX_ROW_SPAN = 6;
export const DEFAULT_COL_SPAN = 4;
export const DEFAULT_ROW_SPAN = 1;
export const MAX_WIDGETS = 20;

export type WidgetGroup = 'Financials' | 'Actions' | 'Tenders' | 'Projects' | 'Integrations';

export const WIDGET_GROUPS: WidgetGroup[] = [
  'Financials',
  'Actions',
  'Tenders',
  'Projects',
  'Integrations',
];

export interface WidgetCatalogEntry {
  id: string;
  group: WidgetGroup;
  name: string;
  desc: string;
  requires?: string;
}

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

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { id: 'cash-at-risk', group: 'Financials', name: 'Cash at risk', desc: 'Total overdue client cash by project.' },
  { id: 'cash-position', group: 'Financials', name: 'Cash position', desc: 'Net position — owed to Icaro vs owed to subbies.' },
  { id: 'client-invoices', group: 'Financials', name: 'Outstanding client invoices', desc: 'Synced from Xero.' },
  { id: 'sub-invoices', group: 'Financials', name: 'Outstanding sub invoices', desc: 'Synced from Xero, after CIS.' },
  { id: 'ceo-actions', group: 'Actions', name: 'CEO action list', desc: 'Open items pulled from Brain Dump.' },
  { id: 'waiting-client', group: 'Actions', name: 'Waiting on client', desc: 'Items stuck on a client decision.' },
  { id: 'brain-dump', group: 'Actions', name: 'Brain dump', desc: 'Quick capture for anything unresolved.' },
  { id: 'tender-snapshot', group: 'Tenders', name: 'Tender snapshot', desc: 'Live tenders currently being priced.' },
  { id: 'live-projects', group: 'Projects', name: 'Live projects', desc: 'Budget and risk summary per project.' },
  { id: 'docusign', group: 'Integrations', name: 'DocuSign — awaiting signature', desc: 'Envelopes sent, not yet signed.' },
  { id: 'dropbox-revisions', group: 'Integrations', name: 'Dropbox — recent revisions', desc: 'New drawings synced from Dropbox.', requires: 'Dropbox' },
  { id: 'gmail-tenders', group: 'Integrations', name: 'Gmail — draft tenders', desc: 'Draft tenders created from parsed emails.', requires: 'Gmail parser' },
];
