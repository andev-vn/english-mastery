import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Search, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { LevelBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { normalizeAnswer } from '@/lib/grading';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useGrammarTopics, useLevels } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';

export default function GrammarPage() {
  const topicsQuery = useGrammarTopics();
  const levelsQuery = useLevels();
  const lessonsProgress = useProgressStore((s) => s.lessons);
  const learnerLevel = useProgressStore((s) => s.profile.level);
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search, 200);

  const filtered = useMemo(() => {
    const q = normalizeAnswer(query);
    return (topicsQuery.data ?? []).filter(
      (t) => !q || [t.title, t.titleVi, t.summaryVi].some((field) => normalizeAnswer(field).includes(q)),
    );
  }, [topicsQuery.data, query]);

  if (topicsQuery.isPending || levelsQuery.isPending) return <PageSkeleton />;
  if (topicsQuery.isError || levelsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void topicsQuery.refetch();
          void levelsQuery.refetch();
        }}
      />
    );
  }

  const sections = levelsQuery.data
    .map((level) => ({ level, topics: filtered.filter((t) => t.level === level.id) }))
    .filter((s) => s.topics.length > 0);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Ngữ pháp" subtitle={`${topicsQuery.data.length} chủ điểm theo cấp độ CEFR`} backTo="/learning-path" />

      <Input
        type="search"
        aria-label="Tìm chủ điểm ngữ pháp"
        placeholder="Tìm: thì quá khứ, so sánh, can…"
        leftIcon={<Search className="size-5" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {sections.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="Không tìm thấy chủ điểm" description="Hãy thử từ khoá khác, ví dụ “present” hoặc “hiện tại”." />
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          {sections.map(({ level, topics }) => (
            <section key={level.id} aria-labelledby={`grammar-${level.id}`}>
              <h2 id={`grammar-${level.id}`} className="mb-3 flex items-center gap-2 text-[17px] font-bold">
                <LevelBadge level={level.id} className="px-2.5 py-1 text-sm" />
                {level.nameVi}
                {level.id === learnerLevel && <span className="text-xs font-medium text-primary">· trình độ của bạn</span>}
              </h2>
              <Card padding="none">
                <ul className="divide-y divide-border">
                  {topics.map((topic) => {
                    const done = lessonsProgress[topic.lessonId]?.status === 'completed';
                    return (
                      <li key={topic.id}>
                        <Link to={`/grammar/${topic.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60">
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-semibold">{topic.titleVi}</span>
                              {done && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Đã học" />}
                            </span>
                            <span className="block truncate text-sm text-text-muted">{topic.summaryVi}</span>
                          </span>
                          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
