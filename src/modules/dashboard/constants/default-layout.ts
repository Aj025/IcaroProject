export interface WidgetInstance {
  id: string;
  colSpan: number;
  rowSpan: number;
}

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'cash-at-risk', colSpan: 4, rowSpan: 2 },
  { id: 'ceo-actions', colSpan: 4, rowSpan: 2 },
  { id: 'waiting-client', colSpan: 4, rowSpan: 1 },
  { id: 'client-invoices', colSpan: 4, rowSpan: 2 },
  { id: 'sub-invoices', colSpan: 4, rowSpan: 2 },
  { id: 'cash-position', colSpan: 4, rowSpan: 1 },
  { id: 'tender-snapshot', colSpan: 4, rowSpan: 1 },
  { id: 'docusign', colSpan: 4, rowSpan: 1 },
  { id: 'brain-dump', colSpan: 4, rowSpan: 2 },
  { id: 'live-projects', colSpan: 8, rowSpan: 2 },
];
