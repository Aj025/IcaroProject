export const TRADES = [
  'Groundworks',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Joinery',
  'Plastering',
  'Other',
] as const;

export type Trade = (typeof TRADES)[number];

export interface Supplier {
  id: string;
  company: string;
  trade: Trade;
  contact: string;
  phone: string;
  email: string;
  note: string;
  projectIds: string[];
  usedBefore: boolean;
  deleted: boolean;
}

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    company: 'Hartley Groundworks',
    trade: 'Groundworks',
    contact: 'Dave Hartley',
    phone: '07700 900123',
    email: 'dave@hartleygroundworks.co.uk',
    note: 'Used on 12 Burtenshaw, reliable, competitive on muck-away',
    projectIds: ['12-burtenshaw'],
    usedBefore: true,
    deleted: false,
  },
  {
    id: 's2',
    company: 'Bright Spark Electrical',
    trade: 'Electrical',
    contact: 'Mike Stevens',
    phone: '07700 900456',
    email: 'mike@brightspark.co.uk',
    note: '',
    projectIds: ['12-burtenshaw'],
    usedBefore: true,
    deleted: false,
  },
  {
    id: 's3',
    company: 'FlowTech Plumbing & Heating',
    trade: 'Plumbing',
    contact: 'Sarah Chen',
    phone: '07700 900789',
    email: 'sarah@flowtech.co.uk',
    note: '',
    projectIds: [],
    usedBefore: true,
    deleted: false,
  },
  {
    id: 's4',
    company: 'Apex Roofing Contractors',
    trade: 'Roofing',
    contact: 'Tom Wright',
    phone: '07700 900321',
    email: 'tom@apexroofing.co.uk',
    note: 'New — not yet used on a project',
    projectIds: [],
    usedBefore: false,
    deleted: false,
  },
];
