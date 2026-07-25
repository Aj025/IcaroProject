import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-bg-panel border border-border-subtle ${
        PADDING[padding]
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  badge,
  actions,
}: {
  eyebrow: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      <span className="eyebrow text-text-secondary">{eyebrow}</span>
      <div className="flex items-center gap-2">
        {badge}
        {actions}
      </div>
    </div>
  );
}
