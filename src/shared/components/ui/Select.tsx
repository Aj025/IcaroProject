import type { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function Select({ className = '', children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`appearance-none rounded-md px-3 py-2 pr-8 bg-bg-input border border-border-subtle text-text-primary text-[13px] cursor-pointer focus:outline-none focus:border-gold/60 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary"
      />
    </div>
  );
}
