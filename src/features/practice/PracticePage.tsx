import { useMemo, useState } from 'react';
import { BookOpenText, Brain, ChevronRight, Code2, Languages, PenLine, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { skillMeta as skillAreaMeta } from '@/features/skills/meta';
import { SKILLS } from '@/types/content';
import { LevelBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useExercises } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import type { ExerciseSkill } from '@/types/content';

type Filter = 'all' | ExerciseSkill;

const skillMeta: Record<ExerciseSkill, { label: string; icon: typeof Brain; className: string }> = {
  grammar: { label: 'Ngữ pháp', icon: PenLine, className: 'bg-primary-soft text-primary' },
  vocabulary: { label: 'Từ vựng', icon: Languages, className: 'bg-secondary-soft text-secondary' },
  reading: { label: 'Đọc hiểu', icon: BookOpenText, className: 'bg-warning-soft text-warning' },
  listening: { label: 'Nghe', icon: Brain, className: 'bg-success-soft text-success' },
  writing: { label: 'Viết', icon: PenLine, className: 'bg-danger-soft text-danger' },
  developer: { label: 'Developer', icon: Code2, className: 'bg-secondary-soft text-secondary' },
};

export default function PracticePage() {
  const query = useExercises();
  const attempts = useProgressStore((s) => s.attempts);
  const level = useProgressStore((s) => s.profile.level);
  const [filter, setFilter] = useState<Filter>('all');

  const bestScores = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of attempts) map.set(a.exerciseId, Math.max(map.get(a.exerciseId) ?? 0, a.score));
    return map;
  }, [attempts]);

  if (query.isPending) return <PageSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const skills = [...new Set(query.data.map((e) => e.skill))];
  const tabs = [{ value: 'all' as Filter, label: 'Tất cả' }, ...skills.map((s) => ({ value: s as Filter, label: skillMeta[s].label }))];
  // Exercises at the learner's level come first.
  const list = query.data
    .filter((e) => filter === 'all' || e.skill === filter)
    .sort((a, b) => Number(b.level === level) - Number(a.level === level));

  return (
    <div className="animate-fade-up">
      <PageHeader title="Luyện tập" subtitle={`${query.data.length} bài · ${attempts.length} lượt đã làm`} />

      <section aria-label="Kỹ năng" className="mb-4 grid grid-cols-2 gap-2.5">
        {SKILLS.map((skill) => {
          const meta = skillAreaMeta[skill];
          const Icon = meta.icon;
          return (
            <Link key={skill} to={`/${skill}`} className="block">
              <Card interactive padding="sm" className="flex h-full flex-col gap-2">
                <span className={`flex size-10 items-center justify-center rounded-xl ${meta.tone}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-semibold">{meta.label}</span>
                <span className="text-xs text-text-muted">{meta.description}</span>
              </Card>
            </Link>
          );
        })}
      </section>
      <Link to="/developer" className="mb-6 block">
        <Card interactive padding="sm" className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
            <Code2 className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Tiếng Anh cho lập trình viên</span>
            <span className="block text-sm text-text-muted">Stand-up, code review, báo cáo lỗi, phỏng vấn</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
        </Card>
      </Link>

      <h2 className="mb-3 text-[17px] font-bold">Bài tập</h2>
      <Tabs label="Lọc theo kỹ năng" value={filter} onChange={setFilter} items={tabs} className="mb-5" />

      {list.length === 0 ? (
        <EmptyState icon={<Brain className="size-7" />} title="Chưa có bài luyện tập cho kỹ năng này" />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((exercise) => {
            const meta = skillMeta[exercise.skill];
            const Icon = meta.icon;
            const best = bestScores.get(exercise.id);
            return (
              <li key={exercise.id}>
                <Link to={`/practice/${exercise.id}`} className="block">
                  <Card interactive padding="sm" className="flex items-center gap-3.5">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${meta.className}`}>
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold">{exercise.titleVi}</span>
                        <LevelBadge level={exercise.level} />
                      </span>
                      <span className="block truncate text-sm text-text-muted">{exercise.description}</span>
                      <span className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                        <span>{exercise.questions.length} câu</span>
                        <span>{exercise.estimatedMinutes} phút</span>
                        {best !== undefined && (
                          <span className="inline-flex items-center gap-1 font-semibold text-success">
                            <Trophy className="size-3.5" aria-hidden /> {best}%
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
