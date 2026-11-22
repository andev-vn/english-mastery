import { Layers } from 'lucide-react';
import { useParams } from 'react-router';
import { LessonCard } from '@/components/learning/LessonCard';
import { LevelBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { lessonStatus } from '@/lib/progress';
import { useLessons, useModule } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const moduleQuery = useModule(moduleId);
  const lessonsQuery = useLessons({ moduleId });
  const lessonsProgress = useProgressStore((s) => s.lessons);
  const profile = useProgressStore((s) => s.profile);

  if (moduleQuery.isPending || lessonsQuery.isPending) return <PageSkeleton />;
  if (moduleQuery.isError || lessonsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void moduleQuery.refetch();
          void lessonsQuery.refetch();
        }}
      />
    );
  }

  const module = moduleQuery.data;
  if (!module) {
    return <EmptyState icon={<Layers className="size-7" />} title="Không tìm thấy chủ đề" action={<ButtonLink to="/learning-path">Xem lộ trình</ButtonLink>} />;
  }

  const lessons = lessonsQuery.data;
  const completed = lessons.filter((l) => lessonsProgress[l.id]?.status === 'completed').length;
  const state = { lessons: lessonsProgress, profile };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={module.titleVi}
        subtitle={
          <span className="flex items-center gap-2">
            <LevelBadge level={module.levelId} /> {module.title}
          </span>
        }
        backTo={`/levels/${module.levelId}`}
      />
      <p className="mb-4 text-[15px] text-text-subtle">{module.description}</p>
      <div className="mb-6 flex items-center gap-3">
        <ProgressBar value={lessons.length ? (completed / lessons.length) * 100 : 0} label="Tiến độ chủ đề" tone="success" />
        <span className="shrink-0 text-sm font-medium text-text-muted tabular-nums">
          {completed}/{lessons.length} bài
        </span>
      </div>
      <ol className="flex flex-col gap-2.5">
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <LessonCard lesson={lesson} index={i + 1} status={lessonStatus(lesson, lessons, state)} />
          </li>
        ))}
      </ol>
    </div>
  );
}
