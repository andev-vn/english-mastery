import { useMemo, useState } from 'react';
import { BookOpenText, CheckCircle2, Dumbbell, Languages } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { WordDetailSheet } from '@/features/vocabulary/WordDetailSheet';
import { countWords } from '@/lib/writingFeedback';
import { useProgressStore } from '@/stores/progressStore';
import { ActivityHeader } from './ActivityHeader';
import { HighlightedText } from './HighlightedText';
import { useActivityPage } from './useActivityPage';
import { useWordSheet } from './useWordSheet';

export default function ReadingActivityPage() {
  const { activity, isPending, isError, refetch, vocabulary, progress } = useActivityPage('reading');
  const completeActivity = useProgressStore((s) => s.completeActivity);
  const [translated, setTranslated] = useState<Set<number>>(new Set());
  const words = useMemo(() => vocabulary.filter((v) => activity?.vocabularyIds.includes(v.id)), [vocabulary, activity]);
  const sheet = useWordSheet(words);

  if (isPending) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!activity) return <EmptyState icon={<BookOpenText className="size-7" />} title="Không tìm thấy bài đọc" action={<ButtonLink to="/reading">Về Luyện đọc</ButtonLink>} />;

  const wordCount = activity.paragraphs.reduce((n, p) => n + countWords(p.en), 0);
  const toggle = (i: number) =>
    setTranslated((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <article className="flex flex-col gap-6 animate-fade-up pb-4">
      <div>
        <ActivityHeader activity={activity} done={Boolean(progress)} />
        <p className="mb-3 text-sm text-text-muted">
          {wordCount} từ · Chạm vào từ được tô màu để xem nghĩa · Chạm “Dịch” để xem bản dịch từng đoạn.
        </p>
        <Card className="flex flex-col gap-4">
          {activity.paragraphs.map((p, i) => (
            <div key={i}>
              <p className="text-[16px] leading-relaxed">
                <HighlightedText text={p.en} words={words} onWord={sheet.open} />
              </p>
              {translated.has(i) && <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-sm text-text-subtle">{p.vi}</p>}
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={translated.has(i)}
                className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary"
              >
                <Languages className="size-4" aria-hidden /> {translated.has(i) ? 'Ẩn bản dịch' : 'Dịch'}
              </button>
            </div>
          ))}
        </Card>
      </div>

      <section aria-labelledby="questions">
        <SectionTitle id="questions" title="Câu hỏi đọc hiểu" />
        <ButtonLink to={`/practice/${activity.exerciseId}?from=${encodeURIComponent(`/reading/${activity.id}`)}`} fullWidth leftIcon={<Dumbbell className="size-5" />}>
          Trả lời câu hỏi
        </ButtonLink>
      </section>

      <Button
        size="lg"
        variant="success"
        leftIcon={<CheckCircle2 className="size-5" />}
        onClick={() => {
          completeActivity({ id: activity.id, title: `Đọc: ${activity.titleVi}`, minutes: Math.max(2, Math.round(wordCount / 60)) });
          toast.success('Đã ghi nhận buổi luyện đọc');
        }}
      >
        Hoàn thành bài đọc
      </Button>

      <WordDetailSheet {...sheet.props} />
    </article>
  );
}
