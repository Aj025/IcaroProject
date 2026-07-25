import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { getProjectById } from '@/shared/data/projects';
import {
  ProjectHeader,
  TabBar,
  VariationsTab,
  TabPlaceholder,
} from './projectsParts';

interface ProjectDetailPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
  projectId: string;
  tab: string;
}

export function ProjectDetailPage({
  activeRoute,
  onNavigate,
  projectId,
  tab,
}: ProjectDetailPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <AppShell
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        <p className="text-text-secondary">Project not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div className="md:hidden flex items-center gap-3 mb-4">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={20} className="text-text-primary" />
        </button>
      </div>

      <ProjectHeader project={project} />
      <TabBar projectId={projectId} activeTabId={tab} onNavigate={onNavigate} />

      {tab === 'variations' ? (
        <VariationsTab variations={project.variations} />
      ) : (
        <TabPlaceholder tabLabel={tab} />
      )}
    </AppShell>
  );
}
