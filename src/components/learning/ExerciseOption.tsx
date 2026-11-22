import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface ExerciseOptionProps {
  label: string;
  marker?: string;
  state: OptionState;
  disabled?: boolean;
  onSelect: () => void;
}

const stateClasses: Record<OptionState, string> = {
  idle: 'border-border bg-surface hover:border-primary/50',
  selected: 'border-primary bg-primary-soft',
  correct: 'border-success bg-success-soft',
  incorrect: 'border-danger bg-danger-soft',
  dimmed: 'border-border bg-surface opacity-55',
};

export function ExerciseOption({ label, marker, state, disabled, onSelect }: ExerciseOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === 'selected' || state === 'correct' || state === 'incorrect'}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-colors disabled:cursor-default',
        stateClasses[state],
      )}
    >
      {marker && (
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-xl border text-sm font-bold uppercase',
            state === 'selected' ? 'border-primary bg-primary text-on-primary' : 'border-border text-text-muted',
            state === 'correct' && 'border-success bg-success text-white',
            state === 'incorrect' && 'border-danger bg-danger text-white',
          )}
          aria-hidden
        >
          {state === 'correct' ? <Check className="size-4" /> : state === 'incorrect' ? <X className="size-4" /> : marker}
        </span>
      )}
      <span className="flex-1">{label}</span>
    </button>
  );
}
