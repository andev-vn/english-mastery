import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn('flex min-h-11 cursor-pointer items-start gap-3 py-1', className)}>
      <span className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer size-6 cursor-pointer appearance-none rounded-lg border-2 border-border bg-surface transition-colors checked:border-primary checked:bg-primary"
          {...props}
        />
        <Check className="pointer-events-none absolute size-4 text-on-primary opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {description && <span className="text-sm text-text-muted">{description}</span>}
      </span>
    </label>
  );
}

interface RadioGroupProps<T extends string> {
  name: string;
  legend: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: { value: T; label: string; description?: string; icon?: ReactNode }[];
  columns?: 1 | 2;
  hideLegend?: boolean;
  /** Render the legend as a prominent question (used in step-by-step flows). */
  prominentLegend?: boolean;
}

export function RadioGroup<T extends string>({ name, legend, value, onChange, options, columns = 1, hideLegend, prominentLegend }: RadioGroupProps<T>) {
  return (
    <fieldset>
      <legend className={cn(prominentLegend ? 'mb-4 text-xl font-bold' : 'mb-3 text-sm font-medium', hideLegend && 'sr-only')}>{legend}</legend>
      <div className={cn('grid gap-2.5', columns === 2 && 'grid-cols-2')}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3 transition-colors',
                'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20',
                checked ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40',
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.icon && <span className={cn('shrink-0', checked ? 'text-primary' : 'text-text-muted')}>{o.icon}</span>}
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold">{o.label}</span>
                {o.description && <span className="text-sm text-text-muted">{o.description}</span>}
              </span>
              <span
                className={cn(
                  'ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  checked ? 'border-primary' : 'border-border',
                )}
                aria-hidden
              >
                {checked && <span className="size-2.5 rounded-full bg-primary" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
