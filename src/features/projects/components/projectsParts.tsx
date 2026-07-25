import { Pill } from '@/shared/components/ui';
import {
  type Project,
  PROJECT_TABS,
  projectRoute,
  summariseVariations,
  type Variation,
} from '@/shared/data/projects';
import { formatGBP } from '@/shared/lib/format';

function HealthDot({ label, tone }: { label: string; tone: string }) {
  const bg = `bg-status-${tone}`;
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${bg}`} />
      {label}
    </div>
  );
}

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[22px] font-semibold m-0 text-text-primary">
          {project.name}
        </h1>
        <p className="text-[13px] text-text-secondary my-1">{project.client}</p>
        <div className="flex flex-wrap gap-4">
          <HealthDot label="Programme" tone={project.health.programme} />
          <HealthDot label="Finance" tone={project.health.finance} />
          <HealthDot label="Compliance" tone={project.health.compliance} />
        </div>
      </div>
      <div className="text-[28px] font-bold text-gold tabular-nums flex-shrink-0">
        {formatGBP(project.contractValue)}
      </div>
    </div>
  );
}

export function TabBar({
  projectId,
  activeTabId,
  onNavigate,
}: {
  projectId: string;
  activeTabId: string;
  onNavigate: (to: string) => void;
}) {
  const active = PROJECT_TABS.find((t) => t.id === activeTabId) ?? PROJECT_TABS[0]!;
  return (
    <div className="flex gap-1 overflow-x-auto mb-6 pb-1 -mx-1 px-1 border-b border-border-subtle">
      {PROJECT_TABS.map((t) => {
        const isActive = t.id === active.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onNavigate(projectRoute(projectId, t.id))}
            className={`flex-shrink-0 px-3 py-2 whitespace-nowrap text-[13px] bg-transparent cursor-pointer ${
              isActive
                ? 'text-gold font-semibold border-b-2 border-gold -mb-px'
                : 'text-text-secondary font-normal border-b-2 border-transparent hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const APPROVAL_TONE = {
  Pending: 'orange',
  Approved: 'green',
  Rejected: 'red',
} as const;

const ISSUE_TONE = {
  Issued: 'blue',
  Answered: 'green',
} as const;

export function VariationsTab({ variations }: { variations: Variation[] }) {
  const totals = summariseVariations(variations);

  return (
    <div className="rounded-xl overflow-hidden bg-bg-panel border border-border-subtle">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <span className="eyebrow text-text-muted">Variations</span>
        <span className="rounded-pill px-2 py-0.5 text-[10.5px] text-text-muted bg-white/[0.04] border border-border-subtle">
          ↔ Dropbox
        </span>
      </div>

      {variations.length === 0 ? (
        <div className="px-5 py-12 text-center text-text-secondary text-[13px]">
          No variations on this project yet.
        </div>
      ) : (
        <>
          <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-subtle">
            {['Ref', 'Description', 'Value', 'Submitted', 'Approval', 'Issue Status', 'Actions'].map(
              (h, i) => (
                <div
                  key={h}
                  className={`eyebrow text-text-muted ${
                    [
                      'col-span-1',
                      'col-span-3',
                      'col-span-1',
                      'col-span-1',
                      'col-span-1',
                      'col-span-3',
                      'col-span-2 text-right',
                    ][i]
                  }`}
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {variations.map((v) => (
            <div
              key={v.id}
              className="px-5 py-4 lg:py-3 lg:grid lg:grid-cols-12 lg:gap-2 lg:items-center border-b border-border-subtle"
            >
              <div className="lg:col-span-1 mb-2 lg:mb-0 text-[13px] text-text-primary font-semibold">
                {v.ref}
              </div>
              <div className="lg:col-span-3 mb-2 lg:mb-0 text-[13.5px] text-text-primary">
                {v.description}
              </div>
              <div className="lg:col-span-1 mb-2 lg:mb-0 text-[13.5px] text-gold font-semibold tabular-nums">
                {formatGBP(v.value)}
              </div>
              <div className="lg:col-span-1 mb-2 lg:mb-0 text-xs text-text-secondary">
                {v.submitted}
              </div>
              <div className="lg:col-span-1 mb-2 lg:mb-0">
                <Pill tone={APPROVAL_TONE[v.approval]}>{v.approval.toUpperCase()}</Pill>
              </div>
              <div className="lg:col-span-3 mb-2 lg:mb-0 flex flex-wrap items-center gap-2">
                <Pill tone={ISSUE_TONE[v.issueStatus]}>
                  {v.issueStatus.toUpperCase()}
                </Pill>
                <span className="text-xs text-text-secondary">
                  {v.issueDate} · {v.issueBy}
                </span>
              </div>
              <div className="lg:col-span-2 lg:text-right">
                <button
                  type="button"
                  className={`text-[12.5px] bg-transparent cursor-pointer ${
                    v.hasResponse ? 'text-text-secondary' : 'text-gold hover:text-gold-hover'
                  }`}
                >
                  {v.hasResponse ? 'View response' : 'Add response'}
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3 text-[12.5px] border-t border-border-subtle">
            <span>
              Approved <span className="text-status-green font-semibold">{formatGBP(totals.approved)}</span>
            </span>
            <span>
              Pending <span className="text-status-orange font-semibold">{formatGBP(totals.pending)}</span>
            </span>
            <span>
              Rejected <span className="text-status-red font-semibold">{formatGBP(totals.rejected)}</span>
            </span>
          </div>
        </>
      )}

      <p className="px-5 py-3 text-xs text-text-muted leading-relaxed m-0">
        Variation content is synced from Dropbox (read-only). Approval reflects the
        client's decision; the issue workflow — status, recipient, response — is
        tracked here in the OS.
      </p>
    </div>
  );
}

export function TabPlaceholder({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="rounded-xl px-5 py-12 text-center bg-bg-panel border border-border-subtle text-text-secondary text-[13px]">
      {tabLabel} content coming soon — reuse the Variations table pattern when data is
      tabular.
    </div>
  );
}
