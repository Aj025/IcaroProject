import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { Button, Input, Select, useToast } from '@/shared/components/ui';
import {
  SEED_SUPPLIERS,
  TRADES,
  type Supplier,
  type Trade,
} from '../data/suppliers';
import { SupplierCard, ArchivedSupplierCard } from './SupplierCard';
import { AddSupplierModal } from './AddSupplierModal';

interface SuppliersDirectoryPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

export function SuppliersDirectoryPage({
  activeRoute,
  onNavigate,
}: SuppliersDirectoryPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState<'All trades' | Trade>('All trades');
  const [showNewModal, setShowNewModal] = useState(false);
  const { show } = useToast();

  function archive(id: string) {
    setSuppliers((prev) => {
      const s = prev.find((x) => x.id === id);
      if (s) {
        show(`Archived ${s.company}`, {
          label: 'Undo',
          onClick: () => restore(id),
        });
      }
      return prev.map((x) => (x.id === id ? { ...x, deleted: true } : x));
    });
  }

  function restore(id: string) {
    setSuppliers((prev) => {
      const s = prev.find((x) => x.id === id);
      if (s) {
        show(`Restored ${s.company}`, {
          label: 'Undo',
          onClick: () => archive(id),
        });
      }
      return prev.map((x) => (x.id === id ? { ...x, deleted: false } : x));
    });
  }

  function createSupplier(supplier: Supplier) {
    setSuppliers((prev) => [supplier, ...prev]);
    setShowNewModal(false);
  }

  const sorted = useMemo(() => {
    const filtered = suppliers.filter((s) => {
      if (s.deleted) return false;
      if (tradeFilter !== 'All trades' && s.trade !== tradeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [s.company, s.trade, s.contact, s.email, s.note]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...filtered].sort(
      (a, b) =>
        TRADES.indexOf(a.trade) - TRADES.indexOf(b.trade) ||
        a.company.localeCompare(b.company),
    );
  }, [suppliers, search, tradeFilter]);

  const archivedSuppliers = suppliers.filter((s) => s.deleted);

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <PageHeader
        title="Suppliers Directory"
        onOpenMenu={() => setSidebarOpen(true)}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setShowNewModal(true)}
          >
            Add Supplier
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search by company, trade, or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <Select
          value={tradeFilter}
          onChange={(e) =>
            setTradeFilter(
              e.target.value === 'All trades'
                ? 'All trades'
                : (e.target.value as Trade),
            )
          }
          className="min-w-[140px]"
        >
          <option>All trades</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl px-5 py-12 text-center bg-bg-panel border border-border-subtle text-text-secondary text-[13px]">
          No suppliers match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onDelete={archive} />
          ))}
        </div>
      )}

      {archivedSuppliers.length > 0 && (
        <div className="mt-8">
          <div className="eyebrow text-text-muted mb-2">
            Archived — {archivedSuppliers.length}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedSuppliers.map((supplier) => (
              <ArchivedSupplierCard
                key={supplier.id}
                supplier={supplier}
                onRestore={restore}
              />
            ))}
          </div>
        </div>
      )}

      <AddSupplierModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={createSupplier}
      />
    </AppShell>
  );
}
