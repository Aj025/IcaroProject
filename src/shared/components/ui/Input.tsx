import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

const FIELD_CLASSES =
  'w-full rounded-md px-3 py-2 bg-bg-input border border-border-subtle text-text-primary text-[13px] placeholder:text-text-muted focus:outline-none focus:border-gold/60';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASSES} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_CLASSES} resize-none ${className}`} {...rest} />;
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block mb-1 text-[12px] text-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-status-red">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
