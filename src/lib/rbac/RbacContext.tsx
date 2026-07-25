import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  emptyPermissions,
  fullPermissions,
  type PermissionModule,
  type Permissions,
  type RbacUser,
  type Role,
} from './types';

interface RbacContextValue {
  user: RbacUser | null;
  role: Role | null;
  can: (module: PermissionModule) => boolean;
  isAdmin: () => boolean;
  permissions: Permissions | null;
}

const RbacContext = createContext<RbacContextValue | null>(null);

function deriveUser(authUser: ReturnType<typeof useAuth>['user']): RbacUser | null {
  if (!authUser) return null;
  const md = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const role = (md.role as Role) ?? 'member';
  const perms = (md.permissions as Partial<Permissions> | undefined) ?? undefined;
  const email = String(authUser.email ?? 'unknown@icaroprojects.com');
  const name =
    (md.full_name as string | undefined) ??
    (md.name as string | undefined) ??
    email.split('@')[0]!;

  return {
    id: authUser.id,
    name,
    email,
    role: role === 'admin' || role === 'estimator' || role === 'pm' ? role : 'pm',
    permissions: perms
      ? { ...emptyPermissions(false), ...perms }
      : role === 'admin'
        ? fullPermissions()
        : emptyPermissions(false),
  };
}

export function RbacProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();

  const value = useMemo<RbacContextValue>(() => {
    const rbacUser = deriveUser(authUser);
    return {
      user: rbacUser,
      role: rbacUser?.role ?? null,
      permissions: rbacUser?.permissions ?? null,
      isAdmin: () => rbacUser?.role === 'admin',
      can: (module: PermissionModule) =>
        rbacUser?.role === 'admin' || !!rbacUser?.permissions?.[module],
    };
  }, [authUser]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac(): RbacContextValue {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error('useRbac must be used inside <RbacProvider>');
  return ctx;
}

export function usePermission(module: PermissionModule): boolean {
  return useRbac().can(module);
}
