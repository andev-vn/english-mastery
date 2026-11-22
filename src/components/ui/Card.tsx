import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md';
  interactive?: boolean;
}

const paddings = { none: '', sm: 'p-4', md: 'p-5' };

export function Card({ padding = 'md', interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border/70 bg-surface shadow-card',
        paddings[padding],
        interactive && 'transition-[transform,border-color] duration-150 hover:border-primary/40 active:scale-[0.99]',
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-[17px] font-bold tracking-tight">
        {title}
      </h2>
      {action}
    </div>
  );
}
