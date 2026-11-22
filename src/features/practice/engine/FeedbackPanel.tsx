import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { correctAnswerText } from '@/lib/grading';
import type { Question } from '@/types/content';

interface FeedbackPanelProps {
  question: Question;
  correct: boolean;
  isLast: boolean;
  onNext: () => void;
}

export function FeedbackPanel({ question, correct, isLast, onNext }: FeedbackPanelProps) {
  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn('animate-sheet-up rounded-t-3xl border-t-2 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl sm:border-2', correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft')}
    >
      <p className={cn('flex items-center gap-2 text-lg font-bold', correct ? 'text-success' : 'text-danger')}>
        {correct ? <CheckCircle2 className="size-6" aria-hidden /> : <XCircle className="size-6" aria-hidden />}
        {correct ? 'Chính xác!' : 'Chưa đúng'}
      </p>
      {!correct && (
        <div className="mt-2">
          <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Đáp án đúng</p>
          <p className="mt-0.5 font-semibold whitespace-pre-line">{correctAnswerText(question)}</p>
        </div>
      )}
      <p className="mt-2 text-sm leading-relaxed text-text-subtle">{question.explanationVi}</p>
      <Button size="lg" fullWidth className="mt-4" variant={correct ? 'success' : 'danger'} onClick={onNext} autoFocus>
        {isLast ? 'Xem kết quả' : 'Tiếp tục'}
      </Button>
    </div>
  );
}
