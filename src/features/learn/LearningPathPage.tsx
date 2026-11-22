import { ChevronRight, Code2, SpellCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, LevelBadge } from '@/components/ui/Badge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CircularProgress } from '@/components/ui/Progress';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { useLevels } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { useModuleSummaries } from './useLevelProgress';

export default function LearningPathPage() {
  const levelsQuery = useLevels();
  const { summaries, isPending, isError, refetch } = useModuleSummaries();
  const currentLevel = useProgressStore((s) => s.profile.level);

  if (levelsQuery.isPending || isPending) return <PageSkeleton />;
  if (levelsQuery.isError || isError || !summaries) return <ErrorState onRetry={refetch} />;

  const developerModules = summaries.filter((s) => s.module.category === 'developer');

  return (
    <div className="animate-fade-up">
      <PageHeader title="Lộ trình học" subtitle="Sáu cấp độ theo khung tham chiếu châu Âu (CEFR)" />

      <Link to="/grammar" className="mb-5 block">
        <Card interactive className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <SpellCheck className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Ngữ pháp theo cấp độ</span>
            <span className="block text-sm text-text-muted">Tra cứu nhanh cấu trúc, ví dụ và lỗi thường gặp</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
        </Card>
      </Link>

      <ol className="relative flex flex-col gap-3">
        {levelsQuery.data.map((level) => {
          const levelSummaries = summaries.filter((s) => s.module.levelId === level.id);
          const total = levelSummaries.reduce((n, s) => n + s.lessons.length, 0);
          const done = levelSummaries.reduce((n, s) => n + s.completed, 0);
          const isCurrent = level.id === currentLevel;
          return (
            <li key={level.id}>
              <Link to={`/levels/${level.id}`} className="block">
                <Card interactive className={cn('flex items-center gap-4', isCurrent && 'border-primary ring-2 ring-primary/15')}>
                  <CircularProgress value={total ? (done / total) * 100 : 0} label={`Tiến độ ${level.id}`} size={56} stroke={5}>
                    <span className="text-sm font-bold">{level.id}</span>
                  </CircularProgress>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{level.nameVi}</h2>
                      {isCurrent && <Badge tone="primary">Trình độ của bạn</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">{level.description}</p>
                    <p className="mt-1.5 text-xs font-medium text-text-subtle">
                      {levelSummaries.length} chủ đề · {done}/{total} bài học
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>

      {developerModules.length > 0 && (
        <section className="mt-8" aria-labelledby="dev-title">
          <SectionTitle id="dev-title" title="Tiếng Anh cho lập trình viên" />
          <div className="flex flex-col gap-3">
            {developerModules.map(({ module, lessons, completed }) => (
              <Link key={module.id} to={`/modules/${module.id}`} className="block">
                <Card interactive className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
                    <Code2 className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{module.titleVi}</h3>
                      <LevelBadge level={module.levelId} />
                    </div>
                    <p className="text-sm text-text-muted">
                      {completed}/{lessons.length} bài học
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
