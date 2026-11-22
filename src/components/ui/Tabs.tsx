import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
  className?: string;
}

/** Segmented tabs following the WAI-ARIA tabs pattern (arrow-key navigation). */
export function Tabs<T extends string>({ label, value, onChange, items, className }: TabsProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + items.length) % items.length;
    const item = items[next];
    if (item) {
      onChange(item.value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto rounded-2xl bg-surface-muted p-1 [scrollbar-width:none]', className)}>
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
              selected ? 'bg-surface text-text shadow-card' : 'text-text-muted hover:text-text',
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span className={cn('rounded-full px-1.5 text-xs', selected ? 'bg-primary-soft text-primary' : 'bg-surface text-text-muted')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
