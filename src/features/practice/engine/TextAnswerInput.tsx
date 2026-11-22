import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { AnswerValue, ErrorCorrectionQuestion, FillBlankQuestion, TranslationQuestion } from '@/types/content';

type TextQuestion = FillBlankQuestion | ErrorCorrectionQuestion | TranslationQuestion;

interface TextAnswerInputProps {
  question: TextQuestion;
  value: AnswerValue | null;
  onChange: (value: AnswerValue | null) => void;
  onSubmit: () => void;
  revealed: boolean;
  correct?: boolean;
}

/** Free-text answers for fill-in-the-blank, error correction and translation. */
export function TextAnswerInput({ question, value, onChange, onSubmit, revealed, correct }: TextAnswerInputProps) {
  const id = useId();
  const text = value && 'text' in value ? value.text : '';
  const multiline = question.type !== 'fill_blank';

  const stimulus =
    question.type === 'fill_blank' ? (
      <p className="rounded-2xl bg-surface p-4 text-[17px] leading-relaxed font-medium">
        {question.sentence.split('___').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className={cn('mx-1 inline-block min-w-16 border-b-2 text-center', revealed ? (correct ? 'border-success text-success' : 'border-danger text-danger') : 'border-primary text-primary')}>
                {text || ' '}
              </span>
            )}
          </span>
        ))}
      </p>
    ) : question.type === 'error_correction' ? (
      <blockquote className="rounded-2xl border-l-4 border-danger bg-surface p-4 text-[16px] font-medium">{question.sentence}</blockquote>
    ) : (
      <blockquote className="rounded-2xl border-l-4 border-secondary bg-surface p-4 text-[16px] font-medium">{question.sourceVi}</blockquote>
    );

  const label =
    question.type === 'fill_blank' ? 'Từ cần điền' : question.type === 'error_correction' ? 'Câu đã sửa' : 'Bản dịch tiếng Anh';

  const inputClasses = cn(
    'w-full rounded-2xl border-2 bg-surface px-4 py-3 text-[16px] transition-colors focus:outline-none focus:ring-4 focus:ring-primary/15',
    revealed ? (correct ? 'border-success' : 'border-danger') : 'border-border focus:border-primary',
  );

  const common = {
    id,
    value: text,
    disabled: revealed,
    autoComplete: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    placeholder: question.type === 'fill_blank' ? 'Nhập từ…' : 'Nhập câu tiếng Anh…',
    onChange: (e: { target: { value: string } }) => onChange(e.target.value.trim() ? { type: question.type, text: e.target.value } : null),
  };

  return (
    <div className="flex flex-col gap-4">
      {stimulus}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-muted">
          {label}
        </label>
        {multiline ? (
          <textarea
            {...common}
            rows={2}
            className={cn(inputClasses, 'resize-none')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        ) : (
          <input
            {...common}
            type="text"
            enterKeyHint="done"
            className={cn(inputClasses, 'min-h-12')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
