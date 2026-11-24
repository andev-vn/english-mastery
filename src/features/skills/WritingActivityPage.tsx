import { useEffect, useState } from 'react';
import { BookMarked, CheckCircle2, Circle, Eye, EyeOff, Info, PenLine, Trash2, TriangleAlert, XCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { analyzeWriting, countWords, type IssueSeverity, type WritingFeedback } from '@/lib/writingFeedback';
import { useProgressStore } from '@/stores/progressStore';
import { AIWritingReview } from '@/features/tutor/AIReview';
import { ActivityHeader } from './ActivityHeader';
import { useActivityPage } from './useActivityPage';

const severityMeta: Record<IssueSeverity, { label: string; icon: typeof Info; className: string }> = {
  error: { label: 'Lỗi', icon: XCircle, className: 'text-danger' },
  warning: { label: 'Nên xem lại', icon: TriangleAlert, className: 'text-warning' },
  tip: { label: 'Gợi ý', icon: Info, className: 'text-primary' },
};

function Feedback({ feedback, min, max }: { feedback: WritingFeedback; min: number; max: number }) {
  const order: IssueSeverity[] = ['error', 'warning', 'tip'];
  const issues = [...feedback.issues].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  return (
    <section role="status" aria-labelledby="feedback" className="flex flex-col gap-4">
      <SectionTitle id="feedback" title="Nhận xét tự động" />
      <Card padding="sm" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span>
          <strong className="tabular-nums">{feedback.wordCount}</strong> từ (gợi ý {min}–{max})
        </span>
        <span>
          <strong className="tabular-nums">{feedback.sentenceCount}</strong> câu
        </span>
        <span>
          <strong className="tabular-nums">{feedback.issues.filter((i) => i.severity === 'error').length}</strong> lỗi
        </span>
      </Card>

      {feedback.checklist.length > 0 && (
        <Card padding="sm">
          <p className="mb-2 text-sm font-bold">Yêu cầu của đề bài</p>
          <ul className="flex flex-col gap-1.5">
            {feedback.checklist.map((c) => (
              <li key={c.labelVi} className="flex items-start gap-2 text-sm">
                {c.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />}
                <span className={cn(!c.passed && 'text-text-muted')}>
                  {c.labelVi}
                  <span className="sr-only">{c.passed ? ' — đạt' : ' — chưa có'}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {issues.length === 0 ? (
        <Card padding="sm" className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-5" aria-hidden /> Không phát hiện lỗi thường gặp nào. Hãy đối chiếu với bài mẫu để cải thiện cách diễn đạt.
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-border">
            {issues.map((issue, i) => {
              const meta = severityMeta[issue.severity];
              const Icon = meta.icon;
              return (
                <li key={`${issue.id}-${i}`} className="flex gap-3 px-4 py-3">
                  <Icon className={cn('mt-0.5 size-5 shrink-0', meta.className)} aria-label={meta.label} />
                  <div className="min-w-0 text-sm">
                    <p>{issue.messageVi}</p>
                    {issue.excerpt && (
                      <p className="mt-1">
                        <span className="rounded bg-danger-soft px-1 text-danger line-through decoration-danger/50">{issue.excerpt}</span>
                        {issue.suggestion && (
                          <>
                            {' → '}
                            <span className="rounded bg-success-soft px-1 font-semibold text-success">{issue.suggestion}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <p className="text-xs text-text-muted">
        Nhận xét dựa trên quy tắc: phát hiện lỗi hình thức và các lỗi phổ biến của người Việt, nhưng không đánh giá được ý tưởng, sự mạch lạc hay mọi lỗi ngữ pháp. Không thay thế được nhận xét của giáo viên.
      </p>
    </section>
  );
}

export default function WritingActivityPage() {
  const { activity, isPending, isError, refetch, progress } = useActivityPage('writing');
  const draft = useProgressStore((s) => (activity ? s.writingDrafts[activity.id] : undefined));
  const saveDraft = useProgressStore((s) => s.saveWritingDraft);
  const completeActivity = useProgressStore((s) => s.completeActivity);
  const journal = useProgressStore((s) => s.journal);
  const addJournalEntry = useProgressStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useProgressStore((s) => s.deleteJournalEntry);
  const [text, setText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [showSample, setShowSample] = useState(false);
  const value = text ?? draft?.text ?? '';
  const debounced = useDebouncedValue(text, 600);

  // Autosave drafts (only after the learner has typed something in this session).
  useEffect(() => {
    if (activity && debounced !== null) saveDraft(activity.id, debounced);
  }, [activity, debounced, saveDraft]);

  if (isPending) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!activity) return <EmptyState icon={<PenLine className="size-7" />} title="Không tìm thấy bài viết" action={<ButtonLink to="/writing">Về Luyện viết</ButtonLink>} />;

  const isJournal = activity.writingType === 'journal';
  const words = countWords(value);
  const check = () =>
    setFeedback(analyzeWriting(value, { minWords: activity.minWords, maxWords: activity.maxWords, checklist: activity.checklist, writingType: activity.writingType }));
  const finish = () => {
    if (isJournal) {
      addJournalEntry(value.trim());
      saveDraft(activity.id, '');
      setText('');
      setFeedback(null);
    }
    completeActivity({ id: activity.id, title: `Viết: ${activity.titleVi}`, minutes: Math.max(3, Math.round(words / 15)) });
    toast.success(isJournal ? 'Đã lưu vào nhật ký' : 'Đã ghi nhận bài viết');
  };

  return (
    <article className="flex flex-col gap-5 animate-fade-up pb-4">
      <div>
        <ActivityHeader activity={activity} done={Boolean(progress)} />
        <Card className="flex flex-col gap-2">
          <p className="text-[16px] font-semibold">{activity.promptEn}</p>
          <p className="text-sm text-text-subtle">{activity.promptVi}</p>
          <p className="text-xs text-text-muted">
            Độ dài gợi ý: {activity.minWords}–{activity.maxWords} từ
          </p>
        </Card>
      </div>

      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="min-h-8 cursor-pointer text-sm font-bold">Mẫu câu hữu ích</summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {activity.usefulPhrases.map((p) => (
            <li key={p.en} className="text-sm">
              <span className="font-semibold">{p.en}</span> <span className="text-text-muted">— {p.vi}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="writing" className="flex items-center justify-between text-sm font-medium">
          Bài viết của bạn
          <span className={cn('tabular-nums', words < activity.minWords ? 'text-text-muted' : words > activity.maxWords ? 'text-warning' : 'text-success')}>{words} từ</span>
        </label>
        <textarea
          id="writing"
          rows={activity.writingType === 'sentence' ? 6 : 10}
          value={value}
          onChange={(e) => {
            setText(e.target.value);
            setFeedback(null);
          }}
          spellCheck
          lang="en"
          placeholder="Viết bằng tiếng Anh…"
          className="w-full resize-y rounded-2xl border-2 border-border bg-surface px-4 py-3 text-[16px] leading-relaxed focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted">Bản nháp được tự động lưu trên thiết bị này.</p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button size="lg" fullWidth disabled={words === 0} onClick={check}>
          Kiểm tra bài viết
        </Button>
        <Button size="lg" fullWidth variant="success" disabled={words < Math.min(10, activity.minWords)} leftIcon={isJournal ? <BookMarked className="size-5" /> : <CheckCircle2 className="size-5" />} onClick={finish}>
          {isJournal ? 'Lưu vào nhật ký' : 'Hoàn thành'}
        </Button>
      </div>

      {feedback && <Feedback feedback={feedback} min={activity.minWords} max={activity.maxWords} />}
      {feedback && <AIWritingReview key={value} text={value} taskVi={activity.promptVi} />}

      <section aria-labelledby="sample">
        <button
          type="button"
          onClick={() => setShowSample((v) => !v)}
          aria-expanded={showSample}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
          id="sample"
        >
          {showSample ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {showSample ? 'Ẩn bài mẫu' : 'Xem bài mẫu'}
        </button>
        {showSample && <Card className="mt-2 text-[15px] leading-relaxed whitespace-pre-line">{activity.sampleAnswer}</Card>}
      </section>

      {isJournal && journal.length > 0 && (
        <section aria-labelledby="journal">
          <SectionTitle id="journal" title={`Nhật ký của bạn (${journal.length})`} />
          <ul className="flex flex-col gap-2.5">
            {journal.map((entry) => (
              <li key={entry.id}>
                <Card padding="sm" className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-muted">{new Date(`${entry.day}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</p>
                    <p className="mt-1 text-[15px] whitespace-pre-line">{entry.text}</p>
                  </div>
                  <IconButton label="Xoá trang nhật ký" icon={<Trash2 className="size-4" />} onClick={() => deleteJournalEntry(entry.id)} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
