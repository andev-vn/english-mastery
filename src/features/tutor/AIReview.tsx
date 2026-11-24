import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { correctWritingWithAI, evaluateAnswerWithAI, tutorErrorMessage, type AIAnswerEvaluation } from '@/services/aiTutor';
import { useCanUseAI } from '@/services/aiQueries';
import { useProgressStore } from '@/stores/progressStore';

/**
 * Optional AI feedback buttons. They render nothing unless the AI tutor is configured on the server
 * and the learner is signed in, so the app never shows an AI action that cannot work.
 * Parents pass a `key` that changes with the learner's text so a stale review is cleared.
 */

const Disclaimer = () => <p className="text-xs text-text-muted">Nhận xét do AI tạo, có thể chưa chính xác.</p>;

export function AIWritingReview({ text, taskVi }: { text: string; taskVi?: string }) {
  const canUse = useCanUseAI();
  const level = useProgressStore((s) => s.profile.level);
  const review = useMutation({ mutationFn: () => correctWritingWithAI({ level, text, taskVi }) });
  if (!canUse) return null;

  return (
    <section aria-labelledby="ai-review" className="flex flex-col gap-3">
      <Button variant="outline" leftIcon={<Sparkles className="size-4" />} disabled={!text.trim() || review.isPending} onClick={() => review.mutate()}>
        {review.isPending ? 'AI đang đọc bài…' : 'Nhận xét bằng AI'}
      </Button>
      {review.isError && (
        <p role="alert" className="text-sm text-danger">
          {tutorErrorMessage(review.error)}
        </p>
      )}
      {review.data && (
        <Card className="flex flex-col gap-3" role="status">
          <h3 id="ai-review" className="flex items-center gap-1.5 text-sm font-bold">
            <Sparkles className="size-4 text-primary" aria-hidden /> Nhận xét của AI
          </h3>
          <p className="text-sm">{review.data.overallVi}</p>
          {review.data.issues.length > 0 && (
            <ul className="flex flex-col gap-2">
              {review.data.issues.map((issue, i) => (
                <li key={i} className="text-sm">
                  <span className="rounded bg-danger-soft px-1 text-danger line-through decoration-danger/50">{issue.original}</span>
                  {' → '}
                  <span className="rounded bg-success-soft px-1 font-semibold text-success">{issue.suggestion}</span>
                  <span className="mt-0.5 block text-text-subtle">{issue.explanationVi}</span>
                </li>
              ))}
            </ul>
          )}
          <div>
            <p className="text-xs font-semibold text-success uppercase">Bài đã sửa</p>
            <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line">{review.data.correctedText}</p>
          </div>
          <Disclaimer />
        </Card>
      )}
    </section>
  );
}

const VERDICT: Record<AIAnswerEvaluation['verdict'], { label: string; className: string }> = {
  good: { label: 'Tốt', className: 'text-success' },
  acceptable: { label: 'Chấp nhận được', className: 'text-primary' },
  needs_work: { label: 'Cần cải thiện', className: 'text-warning' },
};

export function AIAnswerReview({ question, answer }: { question: string; answer: string }) {
  const canUse = useCanUseAI();
  const level = useProgressStore((s) => s.profile.level);
  const review = useMutation({ mutationFn: () => evaluateAnswerWithAI({ level, question, answer }) });
  if (!canUse) return null;

  return (
    <div className="flex flex-col gap-2">
      {!review.data && (
        <Button size="sm" variant="outline" className="self-start" leftIcon={<Sparkles className="size-4" />} disabled={review.isPending} onClick={() => review.mutate()}>
          {review.isPending ? 'AI đang nghe lại…' : 'AI nhận xét câu trả lời'}
        </Button>
      )}
      {review.isError && (
        <p role="alert" className="text-sm text-danger">
          {tutorErrorMessage(review.error)}
        </p>
      )}
      {review.data && (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-primary-soft p-3" role="status">
          <p className="text-sm">
            <span className="font-semibold">AI: </span>
            <span className={VERDICT[review.data.verdict].className}>{VERDICT[review.data.verdict].label}</span>
          </p>
          <p className="text-sm">{review.data.feedbackVi}</p>
          <p className="text-[15px] font-semibold">{review.data.improvedAnswer}</p>
          <Disclaimer />
        </div>
      )}
    </div>
  );
}
