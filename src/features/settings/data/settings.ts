import { PERMISSION_MODULES, type Permissions, type Role } from '@/lib/rbac/types';

export type { Permissions, Role };

export interface Integration {
  id: string;
  name: string;
  desc: string;
}

export const INTEGRATIONS: Integration[] = [
  {
    id: 'xero',
    name: 'Xero',
    desc: 'Client invoices and subcontractor purchase orders',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    desc: 'Variations, RFI, and procurement schedule sheets',
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    desc: 'Contract, variation, and subcontract envelopes',
  },
  {
    id: 'granola',
    name: 'Granola',
    desc: 'Meeting notes and transcripts',
  },
];

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permissions;
  openTenders: number;
}

export const SEED_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Rob Munn',
    email: 'rob@icaroprojects.com',
    role: 'admin',
    permissions: PERMISSION_MODULES.reduce(
      (acc, mod) => ({ ...acc, [mod]: true }),
      {} as Permissions,
    ),
    openTenders: 0,
  },
  {
    id: 'm2',
    name: 'Simon',
    email: 'simon@icaroprojects.com',
    role: 'pm',
    permissions: {
      Financials: false,
      Tenders: true,
      Variations: false,
      RFIs: false,
      Valuations: false,
      Risks: false,
      'Brain Dump': false,
      'Issue to client': false,
    },
    openTenders: 2,
  },
];

export { PERMISSION_MODULES };
