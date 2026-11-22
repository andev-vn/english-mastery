import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'primary' | 'secondary' | 'success' | 'warning';
const tones: Record<Tone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
};
const strokeTones: Record<Tone, string> = {
  primary: 'stroke-primary',
  secondary: 'stroke-secondary',
  success: 'stroke-success',
  warning: 'stroke-warning',
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, label, tone = 'primary', size = 'md', className }: ProgressBarProps) {
  const pct = clamp(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-surface-muted', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  tone?: Tone;
  children?: ReactNode;
}

export function CircularProgress({ value, label, size = 72, stroke = 7, tone = 'primary', children }: CircularProgressProps) {
  const pct = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', strokeTones[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
