import { type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  children: ReactNode;
}

export function AppShell({
  activeRoute,
  onNavigate,
  sidebarOpen,
  setSidebarOpen,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-bg-app text-text-primary text-sm">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 p-5 md:p-8 min-w-0">{children}</main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMenu?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, onOpenMenu, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3">
      <div className="flex items-start gap-3">
        {onOpenMenu && (
          <button
            type="button"
            className="md:hidden p-1"
            onClick={onOpenMenu}
            aria-label="Open menu"
          >
            <Menu size={24} className="text-text-primary" />
          </button>
        )}
        <div>
          <p className="text-xl font-semibold m-0 text-text-primary">{title}</p>
          {subtitle && (
            <p className="text-[13px] text-text-secondary mt-0.5 m-0">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
