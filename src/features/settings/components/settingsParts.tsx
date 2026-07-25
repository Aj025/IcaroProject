import { useState } from 'react';
import { Pill } from '@/shared/components/ui';

interface IntegrationRowProps {
  name: string;
  desc: string;
  connected: boolean;
  onConnect: () => void;
}

export function IntegrationRow({ name, desc, connected, onConnect }: IntegrationRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-t border-border-subtle">
      <div className="flex-1 min-w-[200px]">
        <div className="text-sm font-semibold text-text-primary">{name}</div>
        <div className="text-[12.5px] text-text-secondary mt-0.5">{desc}</div>
      </div>
      <div className="flex items-center gap-3">
        <Pill tone={connected ? 'green' : 'blue'}>
          {connected ? 'CONNECTED' : 'NOT CONNECTED'}
        </Pill>
        {!connected && (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-md px-3 py-1.5 text-[12.5px] bg-transparent border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong cursor-pointer"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    openTenders: number;
    permissions: Record<string, boolean>;
  };
  onTogglePermission: (id: string, mod: string) => void;
  onRemove: (id: string) => void;
  onPreviewAs: (id: string) => void;
}

export function MemberRow({
  member,
  onTogglePermission,
  onRemove,
  onPreviewAs,
}: MemberRowProps) {
  const isAdmin = member.role === 'admin';
  return (
    <div className="py-4 border-t border-border-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-text-primary">{member.name}</div>
          <div className="text-[12.5px] text-text-secondary mt-0.5">{member.email}</div>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <Pill tone="green">ADMIN — FULL ACCESS</Pill>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPreviewAs(member.id)}
                className="text-[12.5px] text-gold bg-transparent hover:text-gold-hover cursor-pointer"
              >
                Preview as
              </button>
              <button
                type="button"
                onClick={() => onRemove(member.id)}
                className="text-[12.5px] text-text-secondary bg-transparent hover:text-text-primary cursor-pointer"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
      {!isAdmin && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.keys(member.permissions).map((mod) => (
            <label
              key={mod}
              className="flex items-center gap-1.5 cursor-pointer text-xs text-text-secondary"
            >
              <input
                type="checkbox"
                checked={!!member.permissions[mod]}
                onChange={() => onTogglePermission(member.id, mod)}
              />
              {mod}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-bg-panel border border-border-subtle p-5 md:p-6 mb-5">
      <h2 className="eyebrow text-text-muted mt-0 mb-4">{title}</h2>
      {children}
      {note && (
        <p className="text-xs text-text-muted mt-4 m-0 leading-relaxed">{note}</p>
      )}
    </section>
  );
}

export function useToastFlag(): [string | null, (msg: string) => void] {
  const [flag, setFlag] = useState<string | null>(null);
  function show(msg: string) {
    setFlag(msg);
    setTimeout(() => setFlag(null), 5000);
  }
  return [flag, show];
}
