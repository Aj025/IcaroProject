import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  DEFAULT_COL_SPAN,
  DEFAULT_ROW_SPAN,
  getSyncBadge,
  getWidgetCatalogEntry,
  type WidgetInstance,
  type WidgetSpan,
} from '../data/widgetCatalog';
import { AddWidgetDrawer } from './AddWidgetDrawer';
import { ResizeHandle } from './ResizeHandle';
import {
  BrainDumpWidget,
  CashAtRiskWidget,
  CashPositionWidget,
  CeoActionsWidget,
  ClientInvoicesWidget,
  DocusignWidget,
  LiveProjectsWidget,
  NotConnectedWidget,
  SubInvoicesWidget,
  TenderSnapshotWidget,
  WaitingClientWidget,
} from './widgets';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { Button, useToast } from '@/shared/components/ui';

interface DashboardPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

const COL_CLASSES: Record<number, string> = {
  2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7',
  8: 'md:col-span-8', 9: 'md:col-span-9', 10: 'md:col-span-10',
  11: 'md:col-span-11', 12: 'md:col-span-12',
};
const ROW_CLASSES: Record<number, string> = {
  1: 'md:row-span-1', 2: 'md:row-span-2', 3: 'md:row-span-3',
  4: 'md:row-span-4', 5: 'md:row-span-5', 6: 'md:row-span-6',
};
function spanClasses(colSpan: number, rowSpan: number): string {
  return `${COL_CLASSES[colSpan] ?? ''} ${ROW_CLASSES[rowSpan] ?? ''}`;
}

function WidgetBody({ id }: { id: string }) {
  switch (id) {
    case 'cash-at-risk':
      return <CashAtRiskWidget />;
    case 'cash-position':
      return <CashPositionWidget />;
    case 'client-invoices':
      return <ClientInvoicesWidget />;
    case 'sub-invoices':
      return <SubInvoicesWidget />;
    case 'ceo-actions':
      return <CeoActionsWidget />;
    case 'waiting-client':
      return <WaitingClientWidget />;
    case 'brain-dump':
      return <BrainDumpWidget />;
    case 'tender-snapshot':
      return <TenderSnapshotWidget />;
    case 'live-projects':
      return <LiveProjectsWidget />;
    case 'docusign':
      return <DocusignWidget />;
    case 'dropbox-revisions':
    case 'gmail-tenders':
      return <NotConnectedWidget />;
    default:
      return null;
  }
}

export function DashboardPage({ activeRoute, onNavigate }: DashboardPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([
    { id: 'cash-at-risk', colSpan: 4, rowSpan: 2 },
    { id: 'ceo-actions', colSpan: 4, rowSpan: 2 },
    { id: 'waiting-client', colSpan: 4, rowSpan: 1 },
    { id: 'client-invoices', colSpan: 4, rowSpan: 2 },
    { id: 'sub-invoices', colSpan: 4, rowSpan: 2 },
    { id: 'cash-position', colSpan: 4, rowSpan: 1 },
    { id: 'tender-snapshot', colSpan: 4, rowSpan: 1 },
    { id: 'docusign', colSpan: 4, rowSpan: 1 },
    { id: 'brain-dump', colSpan: 4, rowSpan: 2 },
    { id: 'live-projects', colSpan: 8, rowSpan: 2 },
  ]);
  const { show } = useToast();
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const activeIds = widgets.map((w) => w.id);

  function removeWidget(id: string) {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx === -1) return;
    const removed = widgets[idx]!;
    const metaName = getWidgetCatalogEntry(id)?.name ?? id;
    setWidgets(widgets.filter((w) => w.id !== id));
    show(`Removed ${metaName}`, {
      label: 'Undo',
      onClick: () => {
        setWidgets((prev) => {
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      },
    });
  }

  function addWidget(id: string) {
    if (activeIds.includes(id)) return;
    setWidgets((prev) => [
      ...prev,
      { id, colSpan: DEFAULT_COL_SPAN, rowSpan: DEFAULT_ROW_SPAN },
    ]);
  }

  function resizeWidget(id: string, next: WidgetSpan) {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...next } : w)),
    );
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from === null || from === index) return;
    setWidgets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved!);
      return next;
    });
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <PageHeader
        title="Home"
        subtitle="Your dashboard — add, remove, and resize widgets to fit how you work."
        onOpenMenu={() => setSidebarOpen(true)}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setDrawerOpen(true)}
          >
            Add widget
          </Button>
        }
      />

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 text-text-secondary">
          <h3 className="text-text-primary m-0 mb-1.5 text-base">Your dashboard is empty</h3>
          <p className="text-[13px] m-0 mb-4">
            Add a widget to start tracking cash, tenders, and projects.
          </p>
          <Button variant="primary" onClick={() => setDrawerOpen(true)}>
            + Add widget
          </Button>
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 auto-rows-auto md:[grid-auto-rows:minmax(160px,auto)] [grid-auto-flow:row] md:[grid-auto-flow:row_dense]"
        >
          {widgets.map((w, index) => {
            const meta = getWidgetCatalogEntry(w.id);
            if (!meta) return null;
            const badge = getSyncBadge(w.id);
            return (
              <div
                key={w.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  dragIndexRef.current = null;
                  setDragOverIndex(null);
                }}
                style={{ cursor: 'grab' }}
                className={`relative rounded-xl p-3 md:p-5 group bg-bg-panel border flex flex-col overflow-hidden min-h-32 md:min-h-0 ${spanClasses(w.colSpan, w.rowSpan)} ${
                  dragOverIndex === index && dragIndexRef.current !== null
                    ? 'border-gold'
                    : 'border-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between mb-3 gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow text-text-secondary">{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="rounded-pill px-2 py-1 text-[11px] text-status-blue bg-status-blue-bg">
                        {badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeWidget(w.id)}
                      className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-text-secondary cursor-pointer hover:text-status-red opacity-0 group-hover:opacity-100"
                      aria-label="Remove widget"
                      title="Remove widget"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 scroll-themed">
                  <WidgetBody id={w.id} />
                </div>
                <ResizeHandle
                  widgetId={w.id}
                  current={{ colSpan: w.colSpan, rowSpan: w.rowSpan }}
                  onResize={(next) => resizeWidget(w.id, next)}
                  gridContainerRef={gridContainerRef}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer border-[1.5px] border-dashed border-border-strong text-text-secondary bg-transparent hover:text-text-primary min-h-32 md:min-h-40 md:col-span-4"
          >
            <Plus size={20} />
            <span className="text-[13px]">Add widget</span>
          </button>
        </div>
      )}

      <AddWidgetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeIds={activeIds}
        onAdd={addWidget}
      />
    </AppShell>
  );
}
