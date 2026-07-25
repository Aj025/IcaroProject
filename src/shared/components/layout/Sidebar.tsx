import { useEffect, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  groupProjectsByStatus,
  getActiveProjectId,
  projectRoute,
  type Project,
} from '@/shared/data/projects';

export const NAV_ITEMS: ReadonlyArray<{ label: string; route: string }> = [
  { label: 'Home', route: '/' },
  { label: 'Tender Register', route: '/tenders' },
  { label: 'Suppliers Directory', route: '/suppliers' },
  { label: 'Settings', route: '/settings' },
];

interface SidebarProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface ProjectSection {
  label: string;
  items: Project[];
}

export function Sidebar({
  activeRoute,
  onNavigate,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const activeProjectId = getActiveProjectId(activeRoute);
  const { ongoing, completed, archive } = groupProjectsByStatus();

  const projectSections: ProjectSection[] = [
    { label: 'Ongoing', items: ongoing },
    { label: 'Completed', items: completed },
    { label: 'Archive', items: archive },
  ].filter((section) => section.items.length > 0);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  useEffect(() => {
    if (!activeProjectId) return;
    projectSections.forEach((section) => {
      if (section.items.some((p) => p.id === activeProjectId) && collapsed[section.label]) {
        setCollapsed((prev) => ({ ...prev, [section.label]: false }));
      }
    });
  }, [activeProjectId, collapsed, projectSections]);

  function isNavActive(route: string): boolean {
    if (route === '/') return activeRoute === '/' || activeRoute === '';
    return activeRoute === route;
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 flex-shrink-0 p-5 overflow-y-auto scroll-themed transform transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-bg-sidebar border-r border-border-subtle`}
      >
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-gold" />
            <div className="text-[13px] font-semibold tracking-[0.06em]">
              ICARO PROJECTS
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-text-secondary"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="list-none p-0 m-0 mb-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.route);
            return (
              <li
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`py-2 px-2 rounded-md cursor-pointer ${
                  active
                    ? 'text-gold font-semibold'
                    : 'text-text-secondary font-normal hover:text-text-primary'
                }`}
              >
                {item.label}
              </li>
            );
          })}
        </ul>

        <div className="eyebrow text-text-muted mb-2">Projects</div>
        <div className="space-y-3">
          {projectSections.map((section) => {
            const isCollapsed = !!collapsed[section.label];
            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={!isCollapsed}
                  className="flex items-center justify-between w-full px-1 mb-1 text-[10px] tracking-[0.08em] uppercase text-text-muted cursor-pointer hover:text-text-secondary bg-transparent"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>
                {!isCollapsed && (
                  <div>
                    {section.items.map((project) => {
                      const active = activeProjectId === project.id;
                      return (
                        <div
                          key={project.id}
                          onClick={() => onNavigate(projectRoute(project.id))}
                          className={`py-1.5 rounded-md cursor-pointer truncate ${
                            active
                              ? 'text-gold font-semibold border-l-2 border-gold pl-2'
                              : 'text-text-secondary font-normal border-l-2 border-transparent pl-1.5 hover:text-text-primary'
                          }`}
                        >
                          {project.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
