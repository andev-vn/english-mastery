import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import type { CefrLevel } from '@/types/content';

export type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-subtle',
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-[#b86e0c] dark:text-warning',
  danger: 'bg-danger-soft text-danger',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}
      {...props}
    />
  );
}

const levelTones: Record<CefrLevel, BadgeTone> = {
  A1: 'success',
  A2: 'success',
  B1: 'primary',
  B2: 'primary',
  C1: 'warning',
  C2: 'danger',
};

export function LevelBadge({ level, className }: { level: CefrLevel; className?: string }) {
  return (
    <Badge tone={levelTones[level]} className={className}>
      {level}
    </Badge>
  );
}
