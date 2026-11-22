import { useMemo, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { ExerciseOption, type OptionState } from '@/components/learning/ExerciseOption';
import { cn } from '@/lib/cn';
import { seededShuffle } from '@/lib/grading';
import type {
  AnswerValue,
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  TrueFalseQuestion,
} from '@/types/content';

interface InputProps<Q> {
  question: Q;
  value: AnswerValue | null;
  onChange: (value: AnswerValue | null) => void;
  /** Set once the answer has been checked. */
  revealed: boolean;
}

function optionState(selected: boolean, isCorrect: boolean, revealed: boolean): OptionState {
  if (!revealed) return selected ? 'selected' : 'idle';
  if (isCorrect) return 'correct';
  return selected ? 'incorrect' : 'dimmed';
}

export function MultipleChoiceInput({ question, value, onChange, revealed }: InputProps<MultipleChoiceQuestion>) {
  const selected = value?.type === 'multiple_choice' ? value.optionId : undefined;
  // Display order is shuffled (stable per question) so the answer position carries no hint.
  const options = useMemo(() => seededShuffle(question.options, question.id + question.prompt), [question]);
  return (
    <div role="radiogroup" aria-label="Các lựa chọn" className="flex flex-col gap-2.5">
      {options.map((o, i) => (
        <ExerciseOption
          key={o.id}
          marker={String.fromCharCode(97 + i)}
          label={o.text}
          disabled={revealed}
          state={optionState(selected === o.id, o.id === question.correctOptionId, revealed)}
          onSelect={() => onChange({ type: 'multiple_choice', optionId: o.id })}
        />
      ))}
    </div>
  );
}

export function TrueFalseInput({ question, value, onChange, revealed }: InputProps<TrueFalseQuestion>) {
  const selected = value?.type === 'true_false' ? value.value : undefined;
  return (
    <div className="flex flex-col gap-4">
      <blockquote className="rounded-2xl border-l-4 border-primary bg-surface p-4 text-[16px] font-medium">{question.statement}</blockquote>
      <div role="radiogroup" aria-label="Đúng hay sai" className="grid grid-cols-2 gap-2.5">
        {[true, false].map((v) => (
          <ExerciseOption
            key={String(v)}
            label={v ? 'True · Đúng' : 'False · Sai'}
            disabled={revealed}
            state={optionState(selected === v, question.answer === v, revealed)}
            onSelect={() => onChange({ type: 'true_false', value: v })}
          />
        ))}
      </div>
    </div>
  );
}

const PAIR_COLORS = [
  'border-primary bg-primary-soft',
  'border-secondary bg-secondary-soft',
  'border-warning bg-warning-soft',
  'border-[#b56be0] bg-[#f3e8fb] dark:bg-[#33213f]',
  'border-[#3f9be0] bg-[#e5f1fb] dark:bg-[#1b2c3d]',
];

export function MatchingInput({ question, value, onChange, revealed }: InputProps<MatchingQuestion>) {
  const [pairs, setPairs] = useState<Record<string, string>>(() => (value?.type === 'matching' ? value.pairs : {}));
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const rights = useMemo(() => seededShuffle(question.pairs.map((p) => p.right), question.id + question.prompt), [question]);
  const lefts = question.pairs.map((p) => p.left);

  const pairIndex = (left: string) => lefts.indexOf(left);
  const leftForRight = (right: string) => Object.keys(pairs).find((l) => pairs[l] === right);

  // The answer only becomes submittable once every item is paired.
  const update = (next: Record<string, string>) => {
    setPairs(next);
    onChange(Object.keys(next).length === lefts.length ? { type: 'matching', pairs: next } : null);
  };

  const pickLeft = (left: string) => {
    if (revealed) return;
    if (pairs[left]) {
      const { [left]: _removed, ...rest } = pairs;
      update(rest);
      setActiveLeft(left);
      return;
    }
    setActiveLeft(activeLeft === left ? null : left);
  };

  const pickRight = (right: string) => {
    if (revealed || !activeLeft) return;
    const next = { ...pairs };
    const previousOwner = leftForRight(right);
    if (previousOwner) delete next[previousOwner];
    next[activeLeft] = right;
    update(next);
    setActiveLeft(null);
  };

  const cellBase = 'flex min-h-14 w-full items-center rounded-2xl border-2 px-3 py-2 text-left text-[15px] font-medium transition-colors';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">Chạm một mục bên trái, rồi chạm mục tương ứng bên phải.</p>
      <div className="grid grid-cols-2 gap-2.5">
        <ul className="flex flex-col gap-2.5" aria-label="Cột trái">
          {lefts.map((left) => {
            const paired = pairs[left];
            const color = paired ? PAIR_COLORS[pairIndex(left) % PAIR_COLORS.length] : undefined;
            const correct = revealed && question.pairs.find((p) => p.left === left)?.right === paired;
            return (
              <li key={left}>
                <button
                  type="button"
                  disabled={revealed}
                  aria-pressed={activeLeft === left}
                  onClick={() => pickLeft(left)}
                  className={cn(
                    cellBase,
                    revealed ? (correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft') : color ?? 'border-border bg-surface',
                    activeLeft === left && 'ring-4 ring-primary/25 border-primary',
                  )}
                >
                  {left}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="flex flex-col gap-2.5" aria-label="Cột phải">
          {rights.map((right) => {
            const owner = leftForRight(right);
            const color = owner ? PAIR_COLORS[pairIndex(owner) % PAIR_COLORS.length] : undefined;
            const ownerCorrect = owner !== undefined && question.pairs.find((p) => p.left === owner)?.right === right;
            return (
              <li key={right}>
                <button
                  type="button"
                  disabled={revealed || !activeLeft}
                  onClick={() => pickRight(right)}
                  className={cn(
                    cellBase,
                    revealed ? (ownerCorrect ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft') : color ?? 'border-border bg-surface',
                    !revealed && activeLeft && !owner && 'border-dashed border-primary/50',
                  )}
                >
                  {right}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function OrderingInput({ question, value, onChange, revealed }: InputProps<OrderingQuestion>) {
  // Track token indices so duplicated words stay distinguishable.
  const shuffled = useMemo(
    () => seededShuffle(question.tokens.map((t, i) => ({ t, i })), question.id + question.tokens.join('|')),
    [question],
  );
  const [picked, setPicked] = useState<number[]>(() => {
    if (value?.type !== 'ordering') return [];
    const used = new Set<number>();
    return value.tokens.flatMap((tok) => {
      const found = shuffled.find((s) => s.t === tok && !used.has(s.i));
      if (!found) return [];
      used.add(found.i);
      return [found.i];
    });
  });

  const emit = (next: number[]) => {
    setPicked(next);
    onChange(next.length === question.tokens.length ? { type: 'ordering', tokens: next.map((i) => question.tokens[i]!) } : null);
  };

  const chipBase = 'min-h-11 rounded-xl border-2 px-3.5 text-[15px] font-medium transition-[transform,colors] active:scale-95';

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex min-h-24 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3',
          revealed ? 'border-transparent bg-surface-muted' : 'border-border',
        )}
        aria-label="Câu của bạn"
        aria-live="polite"
      >
        {picked.length === 0 && <span className="self-center px-1 text-sm text-text-muted">Chạm các từ bên dưới theo đúng thứ tự…</span>}
        {picked.map((i) => (
          <button key={i} type="button" disabled={revealed} onClick={() => emit(picked.filter((p) => p !== i))} className={cn(chipBase, 'border-primary bg-primary-soft')}>
            {question.tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Các từ">
        {shuffled.map(({ t, i }) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={revealed || used}
              onClick={() => emit([...picked, i])}
              className={cn(chipBase, 'border-border bg-surface', used && 'invisible')}
              aria-hidden={used || undefined}
            >
              {t}
            </button>
          );
        })}
      </div>
      {!revealed && picked.length > 0 && (
        <button type="button" onClick={() => emit([])} className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-text-muted hover:text-text">
          <Undo2 className="size-4" aria-hidden /> Làm lại
        </button>
      )}
    </div>
  );
}
