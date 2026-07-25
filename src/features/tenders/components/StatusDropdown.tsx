import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TENDER_STATUSES, STATUS_TONE, type TenderStatus } from '../data/tenders';

const toneClass = (s: TenderStatus) => {
  const tone = STATUS_TONE[s];
  return {
    color: `text-status-${tone}`,
    bg: `bg-status-${tone}-bg`,
  };
};

interface StatusDropdownProps {
  value: TenderStatus;
  onChange: (s: TenderStatus) => void;
}

export function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const cls = toneClass(value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`flex items-center gap-1 rounded-pill px-2 py-1 text-[10.5px] font-bold tracking-[0.02em] cursor-pointer ${cls.color} ${cls.bg}`}
      >
        {value.toUpperCase()}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 rounded-md py-1 min-w-[120px] bg-bg-panel-hover border border-border-strong">
          {TENDER_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs bg-transparent cursor-pointer ${
                s === value ? 'text-gold' : 'text-text-primary hover:text-gold-hover'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
