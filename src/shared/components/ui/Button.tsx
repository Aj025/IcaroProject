import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gold text-gold-ink font-semibold hover:bg-gold-hover focus-visible:outline-gold',
  secondary:
    'bg-transparent text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-strong',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-[13px]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gold ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
