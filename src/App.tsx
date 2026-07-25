import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { RbacProvider } from '@/lib/rbac/RbacContext';
import { LoginPage } from '@/lib/auth/LoginPage';
import { isAuthEnabled } from '@/lib/auth/supabaseClient';
import { parseProjectRoute } from '@/shared/data/projects';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { TenderRegisterPage } from '@/features/tenders/components/TenderRegisterPage';
import { SuppliersDirectoryPage } from '@/features/suppliers/components/SuppliersDirectoryPage';
import { SettingsPage } from '@/features/settings/components/SettingsPage';
import { ProjectDetailPage } from '@/features/projects/components/ProjectDetailPage';

interface PageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

function getInitialRoute(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

function Router() {
  const [route, setRoute] = useState(getInitialRoute);
  const { loading, user } = useAuth();

  useEffect(() => {
    const onHashChange = () => setRoute(getInitialRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(to: string) {
    window.location.hash = to;
    setRoute(to);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app text-text-secondary">
        Loading…
      </div>
    );
  }

  if (isAuthEnabled && !user) {
    return <LoginPage />;
  }
  // if (true) {
  //     return <LoginPage />;
  // }
  
  const props: PageProps = { activeRoute: route, onNavigate: navigate };

  if (route === '/tenders') return <TenderRegisterPage {...props} />;
  if (route === '/suppliers') return <SuppliersDirectoryPage {...props} />;
  if (route === '/settings') return <SettingsPage {...props} />;

  const projectMatch = parseProjectRoute(route);
  if (projectMatch) {
    return (
      <ProjectDetailPage
        {...props}
        projectId={projectMatch.projectId}
        tab={projectMatch.tab}
      />
    );
  }

  return <DashboardPage {...props} />;
}

export default function App() {
  return (
    <AuthProvider>
      <RbacProvider>
        <Router />
      </RbacProvider>
    </AuthProvider>
  );
}
