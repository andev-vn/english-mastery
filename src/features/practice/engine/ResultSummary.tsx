import { CheckCircle2, RotateCcw, XCircle, Zap } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/Progress';
import { cn } from '@/lib/cn';
import { correctAnswerText, scorePercent } from '@/lib/grading';
import type { AnswerResult, Exercise } from '@/types/content';

interface ResultSummaryProps {
  exercise: Exercise;
  results: AnswerResult[];
  xp: number;
  durationSeconds: number;
  onRetry: () => void;
  continueTo: { to: string; label: string };
}

export function ResultSummary({ exercise, results, xp, durationSeconds, onRetry, continueTo }: ResultSummaryProps) {
  const correct = results.filter((r) => r.correct).length;
  const score = scorePercent(correct, results.length);
  const mistakes = results.filter((r) => !r.correct);
  const message = score === 100 ? 'Hoàn hảo! 🎉' : score >= 80 ? 'Rất tốt!' : score >= 50 ? 'Khá ổn, cố lên!' : 'Hãy ôn lại và thử lần nữa nhé';

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="flex flex-col items-center pt-6 text-center">
        <CircularProgress value={score} label="Điểm" size={132} stroke={11} tone={score >= 80 ? 'success' : score >= 50 ? 'primary' : 'warning'}>
          <span>
            <span className="block text-3xl font-extrabold tabular-nums">{score}%</span>
            <span className="block text-xs text-text-muted">
              {correct}/{results.length} câu đúng
            </span>
          </span>
        </CircularProgress>
        <h1 className="mt-5 text-2xl font-bold">{message}</h1>
        <p className="mt-1 text-sm text-text-muted">{exercise.titleVi}</p>
        <div className="mt-4 flex gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            <Zap className="size-4" aria-hidden /> +{xp} XP
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-text-subtle">
            {Math.max(1, Math.round(durationSeconds / 60))} phút
          </span>
        </div>
        {xp === 0 && <p className="mt-2 max-w-xs text-xs text-text-muted">XP chỉ được cộng khi bạn cải thiện kết quả tốt nhất của bài này.</p>}
      </div>

      {mistakes.length > 0 && (
        <section aria-labelledby="mistakes-title">
          <h2 id="mistakes-title" className="mb-2.5 font-bold">
            Xem lại câu sai ({mistakes.length})
          </h2>
          <div className="flex flex-col gap-2.5">
            {mistakes.map((r) => {
              const q = exercise.questions.find((x) => x.id === r.questionId);
              if (!q) return null;
              return (
                <Card key={r.questionId} padding="sm">
                  <p className="text-sm font-semibold">{q.prompt}</p>
                  <p className="mt-1.5 flex gap-1.5 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span className="whitespace-pre-line">{correctAnswerText(q)}</span>
                  </p>
                  <p className="mt-1.5 text-sm text-text-muted">{q.explanationVi}</p>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Kết quả từng câu">
        {results.map((r, i) => (
          <li key={r.questionId}>
            <span className={cn('flex size-8 items-center justify-center rounded-lg', r.correct ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
              {r.correct ? <CheckCircle2 className="size-4" aria-label={`Câu ${i + 1} đúng`} /> : <XCircle className="size-4" aria-label={`Câu ${i + 1} sai`} />}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-col gap-2.5">
        <ButtonLink to={continueTo.to} size="lg" fullWidth replace>
          {continueTo.label}
        </ButtonLink>
        <Button variant="outline" size="lg" fullWidth leftIcon={<RotateCcw className="size-4" />} onClick={onRetry}>
          Làm lại
        </Button>
      </div>
    </div>
  );
}
