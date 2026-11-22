import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required because the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'soft' | 'outline';
  active?: boolean;
}

const variants = {
  ghost: 'text-text-subtle hover:bg-surface-muted hover:text-text',
  soft: 'bg-surface-muted text-text hover:brightness-95 dark:hover:brightness-125',
  outline: 'border border-border bg-surface text-text hover:bg-surface-muted',
};

export function IconButton({ label, icon, variant = 'ghost', active, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors active:scale-95 disabled:opacity-50',
        variants[variant],
        active && 'text-primary',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
