export const PROJECT_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  ARCHIVE: 'archive',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export interface Variation {
  id: string;
  ref: string;
  description: string;
  value: number;
  submitted: string;
  approval: 'Pending' | 'Approved' | 'Rejected';
  issueStatus: 'Issued' | 'Answered';
  issueDate: string;
  issueBy: string;
  hasResponse: boolean;
}

export interface ProjectHealth {
  programme: 'red' | 'orange' | 'green';
  finance: 'red' | 'orange' | 'green';
  compliance: 'red' | 'orange' | 'green';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  contractValue: number;
  status: ProjectStatus;
  health: ProjectHealth;
  variations: Variation[];
}

export interface ProjectTab {
  id: string;
  label: string;
}

export const PROJECT_TABS: ProjectTab[] = [
  { id: 'variations', label: 'Variations' },
  { id: 'rfis', label: 'RFIs' },
  { id: 'procurement', label: 'Procurement' },
  { id: 'follow-ups', label: 'Follow-ups' },
  { id: 'financials', label: 'Financials' },
  { id: 'docusign', label: 'DocuSign' },
  { id: 'hs-onboarding', label: 'H&S / Onboarding' },
  { id: 'sub-quotes', label: 'Sub Quotes' },
  { id: 'sub-orders', label: 'Sub Orders' },
  { id: 'snagging', label: 'Snagging' },
  { id: 'meeting-notes', label: 'Meeting Notes' },
  { id: 'risk-register', label: 'Risk Register' },
];

export const PROJECTS: Project[] = [
  {
    id: '12-burtenshaw',
    name: '12 Burtenshaw',
    client: 'Private Client',
    contractValue: 850_000,
    status: PROJECT_STATUS.ONGOING,
    health: { programme: 'orange', finance: 'green', compliance: 'red' },
    variations: [
      {
        id: 'var-001',
        ref: 'VAR-001',
        description: 'Upgrade rear extension glazing to triple glazed',
        value: 6_200,
        submitted: '30 Jun 2026',
        approval: 'Pending',
        issueStatus: 'Issued',
        issueDate: '30 Jun 2026',
        issueBy: 'Rob Munn',
        hasResponse: false,
      },
      {
        id: 'var-002',
        ref: 'VAR-002',
        description: 'Relocate kitchen island per client request',
        value: 3_400,
        submitted: '22 Jun 2026',
        approval: 'Approved',
        issueStatus: 'Answered',
        issueDate: '25 Jun 2026',
        issueBy: 'Private Client',
        hasResponse: true,
      },
    ],
  },
  {
    id: 'ashcombe-refurb',
    name: 'Ashcombe Refurb',
    client: 'Ashcombe Estates',
    contractValue: 320_000,
    status: PROJECT_STATUS.ONGOING,
    health: { programme: 'green', finance: 'orange', compliance: 'green' },
    variations: [
      {
        id: 'var-003',
        ref: 'VAR-001',
        description: 'Upgrade bathroom suite to client spec',
        value: 4_800,
        submitted: '15 Jul 2026',
        approval: 'Pending',
        issueStatus: 'Issued',
        issueDate: '15 Jul 2026',
        issueBy: 'Rob Munn',
        hasResponse: false,
      },
    ],
  },
  {
    id: 'hartley-barn',
    name: 'Hartley Barn Restoration',
    client: 'Hartley Trust',
    contractValue: 215_000,
    status: PROJECT_STATUS.COMPLETED,
    health: { programme: 'green', finance: 'green', compliance: 'green' },
    variations: [
      {
        id: 'var-004',
        ref: 'VAR-001',
        description: 'Heritage window restoration — additional units',
        value: 8_900,
        submitted: '10 Mar 2026',
        approval: 'Approved',
        issueStatus: 'Answered',
        issueDate: '14 Mar 2026',
        issueBy: 'Hartley Trust',
        hasResponse: true,
      },
    ],
  },
  {
    id: 'oakridge-extension',
    name: 'Oakridge Extension',
    client: 'Oakridge Homes',
    contractValue: 98_000,
    status: PROJECT_STATUS.ARCHIVE,
    health: { programme: 'green', finance: 'green', compliance: 'green' },
    variations: [],
  },
];

export function getProjectById(id: string): Project | null {
  return PROJECTS.find((p) => p.id === id) ?? null;
}

export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return PROJECTS.filter((p) => p.status === status);
}

export function groupProjectsByStatus(): {
  ongoing: Project[];
  completed: Project[];
  archive: Project[];
} {
  return {
    ongoing: getProjectsByStatus(PROJECT_STATUS.ONGOING),
    completed: getProjectsByStatus(PROJECT_STATUS.COMPLETED),
    archive: getProjectsByStatus(PROJECT_STATUS.ARCHIVE),
  };
}

export function projectRoute(projectId: string, tab = 'variations'): string {
  return `/projects/${projectId}/${tab}`;
}

export interface ParsedProjectRoute {
  projectId: string;
  tab: string;
}

export function parseProjectRoute(route: string): ParsedProjectRoute | null {
  const match = route.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;
  return { projectId: match[1]!, tab: match[2] ?? 'variations' };
}

export function getActiveProjectId(route: string): string | null {
  return parseProjectRoute(route)?.projectId ?? null;
}

export interface VariationTotals {
  approved: number;
  pending: number;
  rejected: number;
}

export function summariseVariations(variations: Variation[]): VariationTotals {
  return variations.reduce<VariationTotals>(
    (acc, v) => {
      const key = v.approval.toLowerCase();
      if (key === 'approved') acc.approved += v.value;
      else if (key === 'pending') acc.pending += v.value;
      else if (key === 'rejected') acc.rejected += v.value;
      return acc;
    },
    { approved: 0, pending: 0, rejected: 0 },
  );
}
