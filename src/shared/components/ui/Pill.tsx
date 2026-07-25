import type { ReactNode } from 'react';

export type Tone = 'red' | 'orange' | 'green' | 'blue';

const TONE_CLASSES: Record<Tone, string> = {
  red: 'bg-status-red-bg text-status-red',
  orange: 'bg-status-orange-bg text-status-orange',
  green: 'bg-status-green-bg text-status-green',
  blue: 'bg-status-blue-bg text-status-blue',
};

interface PillProps {
  tone: Tone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone, children, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-1 whitespace-nowrap text-[10.5px] font-bold tracking-[0.02em] ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
