export const TENDER_STATUSES = [
  'Pricing',
  'Tendering',
  'Issued',
  'Won',
  'Lost',
  'Withdrawn',
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];

export interface Tender {
  id: string;
  client: string;
  job: string;
  received: string;
  due: string;
  contractSum: number;
  status: TenderStatus;
  deleted: boolean;
}

export const STATUS_TONE: Record<TenderStatus, 'red' | 'orange' | 'green' | 'blue'> = {
  Pricing: 'blue',
  Tendering: 'orange',
  Issued: 'blue',
  Won: 'green',
  Lost: 'red',
  Withdrawn: 'orange',
};

export const SEED_TENDERS: Tender[] = [
  {
    id: 't1',
    client: 'Private Client',
    job: 'Rear extension + loft conversion',
    received: '24 Jun 2026',
    due: '05 Jul 2026',
    contractSum: 145_000,
    status: 'Pricing',
    deleted: false,
  },
  {
    id: 't2',
    client: 'Ashcombe Estates',
    job: 'Full refurb — 4 bed detached',
    received: '28 Jun 2026',
    due: '08 Jul 2026',
    contractSum: 320_000,
    status: 'Tendering',
    deleted: false,
  },
  {
    id: 't3',
    client: 'Bramley Developments',
    job: 'New build — 3 townhouses',
    received: '10 Jun 2026',
    due: '01 Jul 2026',
    contractSum: 680_000,
    status: 'Issued',
    deleted: false,
  },
  {
    id: 't4',
    client: 'Hartley Trust',
    job: 'Heritage barn restoration',
    received: '02 Jun 2026',
    due: '20 Jun 2026',
    contractSum: 215_000,
    status: 'Won',
    deleted: false,
  },
  {
    id: 't5',
    client: 'Oakridge Homes',
    job: 'Wraparound extension + garage',
    received: '15 Jun 2026',
    due: '29 Jun 2026',
    contractSum: 98_000,
    status: 'Lost',
    deleted: false,
  },
];
