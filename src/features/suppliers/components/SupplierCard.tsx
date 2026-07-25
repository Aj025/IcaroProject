import { Trash2, RotateCcw } from 'lucide-react';
import { Pill } from '@/shared/components/ui';
import { getProjectById } from '@/shared/data/projects';
import type { Supplier } from '../data/suppliers';

function projectLabel(projectIds: string[]): string {
  if (!projectIds.length) return 'No projects yet';
  return projectIds.map((id) => getProjectById(id)?.name ?? id).join(', ');
}

export function SupplierCard({
  supplier,
  onDelete,
}: {
  supplier: Supplier;
  onDelete: (id: string) => void;
}) {
  const contactLine = [supplier.contact, supplier.phone, supplier.email]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-xl p-5 flex flex-col group bg-bg-panel border border-border-subtle">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="eyebrow text-gold">{supplier.trade}</div>
        <button
          type="button"
          onClick={() => onDelete(supplier.id)}
          className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-text-secondary cursor-pointer hover:text-status-red"
          aria-label="Archive supplier"
          title="Archive this supplier"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="text-base font-semibold text-text-primary mb-1.5">
        {supplier.company}
      </div>

      {contactLine && (
        <div className="text-[12.5px] text-text-secondary mb-2">{contactLine}</div>
      )}

      {supplier.note && (
        <div className="text-[12.5px] text-text-secondary leading-relaxed">
          {supplier.note}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle">
        <span className="text-xs text-text-secondary">
          {projectLabel(supplier.projectIds)}
        </span>
        <Pill tone={supplier.usedBefore ? 'green' : 'blue'}>
          {supplier.usedBefore ? 'USED BEFORE' : 'NEW — NOT USED'}
        </Pill>
      </div>
    </div>
  );
}

export function ArchivedSupplierCard({
  supplier,
  onRestore,
}: {
  supplier: Supplier;
  onRestore: (id: string) => void;
}) {
  return (
    <div className="rounded-xl p-5 flex flex-col bg-bg-panel border border-border-subtle opacity-70">
      <div className="eyebrow text-text-muted mb-2">{supplier.trade}</div>
      <div className="text-base font-semibold text-text-secondary mb-1.5">
        {supplier.company}
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle">
        <Pill tone="red">ARCHIVED</Pill>
        <button
          type="button"
          onClick={() => onRestore(supplier.id)}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-status-green cursor-pointer"
          aria-label="Restore supplier"
          title="Restore this supplier"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
