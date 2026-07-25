export type Role = 'admin' | 'estimator' | 'pm';

export const PERMISSION_MODULES = [
  'Financials',
  'Tenders',
  'Variations',
  'RFIs',
  'Valuations',
  'Risks',
  'Brain Dump',
  'Issue to client',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type Permissions = Record<PermissionModule, boolean>;

export interface RbacUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permissions;
}

export function emptyPermissions(value = false): Permissions {
  return PERMISSION_MODULES.reduce((acc, m) => {
    acc[m] = value;
    return acc;
  }, {} as Permissions);
}

export function fullPermissions(): Permissions {
  return emptyPermissions(true);
}
