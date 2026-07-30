export interface WidgetInstance {
  id: string;
  x: number;
  y: number;
  colSpan: number;
  rowSpan: number;
}

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'cash-at-risk', x: 0, y: 0, colSpan: 4, rowSpan: 2 },
  { id: 'ceo-actions', x: 4, y: 0, colSpan: 4, rowSpan: 2 },
  { id: 'waiting-client', x: 8, y: 0, colSpan: 4, rowSpan: 1 },
  { id: 'client-invoices', x: 0, y: 2, colSpan: 4, rowSpan: 2 },
  { id: 'sub-invoices', x: 4, y: 2, colSpan: 4, rowSpan: 2 },
  { id: 'cash-position', x: 8, y: 1, colSpan: 4, rowSpan: 1 },
  { id: 'tender-snapshot', x: 0, y: 4, colSpan: 4, rowSpan: 1 },
  { id: 'docusign', x: 4, y: 4, colSpan: 4, rowSpan: 1 },
  { id: 'brain-dump', x: 8, y: 2, colSpan: 4, rowSpan: 2 },
  { id: 'live-projects', x: 0, y: 5, colSpan: 8, rowSpan: 2 },
];
