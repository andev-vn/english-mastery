import { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkPlus, PartyPopper, RotateCw, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SpeakButton } from '@/components/learning/SpeakButton';
import { partOfSpeechVi } from '@/components/learning/VocabularyCard';
import { LevelBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { secondsSince } from '@/lib/date';
import { isDue, type ReviewGrade } from '@/lib/srs';
import { useVocabulary } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';

const grades: { grade: ReviewGrade; label: string; hint: string; className: string }[] = [
  { grade: 'again', label: 'Quên', hint: 'Ôn lại', className: 'bg-danger-soft text-danger' },
  { grade: 'hard', label: 'Khó', hint: 'Chật vật', className: 'bg-warning-soft text-warning' },
  { grade: 'good', label: 'Nhớ', hint: 'Ổn', className: 'bg-primary-soft text-primary' },
  { grade: 'easy', label: 'Dễ', hint: 'Rất dễ', className: 'bg-success-soft text-success' },
];

export default function VocabularyReviewPage() {
  const navigate = useNavigate();
  const vocabQuery = useVocabulary();
  const reviewWord = useProgressStore((s) => s.reviewWord);
  const finishReviewSession = useProgressStore((s) => s.finishReviewSession);
  const [mode, setMode] = useState<'due' | 'all'>('due');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, xp: 0 });
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const words = vocabQuery.data;

  // Snapshot the queue once per mode so cards don't disappear mid-session as they get rescheduled.
  const queue = useMemo(() => {
    if (!words) return [];
    const known = new Set(words.map((w) => w.id));
    const cards = Object.values(useProgressStore.getState().cards).filter((c) => known.has(c.wordId));
    const picked = mode === 'due' ? cards.filter((c) => isDue(c)) : cards;
    return picked.sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt)).map((c) => c.wordId);
  }, [mode, words]);

  if (vocabQuery.isPending) return <PageSkeleton />;
  if (vocabQuery.isError) return <ErrorState onRetry={() => void vocabQuery.refetch()} />;

  const savedCount = Object.keys(useProgressStore.getState().cards).length;
  const done = index >= queue.length;

  const header = (
    <header className="flex items-center gap-2 pb-6">
      <IconButton label="Đóng ôn tập" icon={<X className="size-5" />} className="-ml-2.5" onClick={() => navigate('/vocabulary', { replace: true })} />
      <ProgressBar value={queue.length ? (index / queue.length) * 100 : 100} label="Tiến độ ôn tập" tone="secondary" />
      <span className="shrink-0 text-sm font-semibold text-text-muted tabular-nums">
        {Math.min(index + 1, queue.length)}/{queue.length}
      </span>
    </header>
  );

  if (queue.length === 0 || done) {
    const finished = queue.length > 0;
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <EmptyState
          className="my-auto"
          icon={finished ? <PartyPopper className="size-7" /> : <BookmarkPlus className="size-7" />}
          title={finished ? `Bạn đã ôn ${stats.reviewed} từ!` : savedCount === 0 ? 'Chưa có từ nào để ôn' : 'Không có từ nào đến hạn'}
          description={
            finished
              ? `+${stats.xp} XP. Các từ sẽ quay lại đúng lúc bạn sắp quên.`
              : savedCount === 0
                ? 'Lưu các từ bạn muốn nhớ trong mục Từ vựng.'
                : 'Bạn có thể ôn thêm tất cả các từ đã lưu (không tính XP).'
          }
          action={
            <div className="flex flex-col gap-2.5">
              {!finished && savedCount > 0 && mode === 'due' && (
                <Button
                  leftIcon={<RotateCw className="size-4" />}
                  onClick={() => {
                    setMode('all');
                    setIndex(0);
                  }}
                >
                  Ôn tất cả {savedCount} từ đã lưu
                </Button>
              )}
              <ButtonLink to="/vocabulary" variant={finished || savedCount === 0 ? 'primary' : 'outline'} replace>
                Về Từ vựng
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const wordId = queue[index]!;
  const entry = vocabQuery.data.find((w) => w.id === wordId);

  if (!entry) return null;

  const grade = (g: ReviewGrade) => {
    const xp = reviewWord(wordId, g);
    const next = { reviewed: stats.reviewed + 1, xp: stats.xp + xp };
    setStats(next);
    setFlipped(false);
    setIndex(index + 1);
    if (index + 1 >= queue.length) {
      finishReviewSession({ ...next, durationSeconds: secondsSince(startedAt.current) });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {header}
      <div className="flex flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Lật lại mặt trước' : 'Lật thẻ để xem nghĩa'}
          className={cn(
            'relative flex min-h-80 w-full flex-col items-center justify-center rounded-[1.75rem] border border-border bg-surface p-6 text-center shadow-raised transition-transform duration-200 active:scale-[0.99]',
          )}
        >
          <LevelBadge level={entry.level} className="absolute top-5 left-5" />
          <span className="text-[34px] font-extrabold tracking-tight">{entry.word}</span>
          <span className="mt-1 text-text-muted">{entry.ipa}</span>
          {flipped ? (
            <span className="mt-6 flex animate-fade-up flex-col gap-3">
              <span className="text-sm text-text-muted italic">{partOfSpeechVi(entry.partOfSpeech)}</span>
              <span className="text-xl font-bold text-primary">{entry.meaningVi}</span>
              <span className="text-[15px] text-text-subtle">“{entry.example}”</span>
              <span className="text-sm text-text-muted">{entry.exampleVi}</span>
            </span>
          ) : (
            <span className="mt-8 text-sm text-text-muted">Bạn có nhớ nghĩa của từ này? Chạm để lật thẻ.</span>
          )}
        </button>
        <div className="mt-3 flex justify-center">
          <SpeakButton text={entry.word} />
        </div>
      </div>

      <div className="mt-6 pb-[env(safe-area-inset-bottom)]">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Bạn nhớ từ này thế nào?">
            {grades.map((g) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => grade(g.grade)}
                className={cn('flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 font-bold transition-transform active:scale-95', g.className)}
              >
                <span className="text-[15px]">{g.label}</span>
                <span className="text-[10px] font-medium opacity-80">{g.hint}</span>
              </button>
            ))}
          </div>
        ) : (
          <Button size="lg" fullWidth onClick={() => setFlipped(true)}>
            Hiện nghĩa
          </Button>
        )}
      </div>
    </div>
  );
}
