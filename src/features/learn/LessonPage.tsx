import { useEffect } from 'react';
import { BookX, CheckCircle2, Clock, Lock, Target } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { LevelBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { lessonStatus } from '@/lib/progress';
import { useLesson, useLessons } from '@/services/contentQueries';
import { syncLessonCompleted } from '@/services/progressSync';
import { useProgressStore } from '@/stores/progressStore';
import { ContentBlocks } from './ContentBlocks';

export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const lessonQuery = useLesson(lessonId);
  const lesson = lessonQuery.data;
  const moduleLessonsQuery = useLessons({ moduleId: lesson?.moduleId });
  const lessonsProgress = useProgressStore((s) => s.lessons);
  const profile = useProgressStore((s) => s.profile);
  const startLesson = useProgressStore((s) => s.startLesson);
  const completeLesson = useProgressStore((s) => s.completeLesson);

  const status = lesson && moduleLessonsQuery.data ? lessonStatus(lesson, moduleLessonsQuery.data, { lessons: lessonsProgress, profile }) : undefined;

  useEffect(() => {
    if (lesson && status === 'available') startLesson(lesson.id);
  }, [lesson, status, startLesson]);

  if (lessonQuery.isPending || (lesson && moduleLessonsQuery.isPending)) return <PageSkeleton />;
  if (lessonQuery.isError) return <ErrorState onRetry={() => void lessonQuery.refetch()} />;
  if (!lesson) {
    return (
      <EmptyState
        icon={<BookX className="size-7" />}
        title="Không tìm thấy bài học"
        description="Bài học này không tồn tại hoặc đã được di chuyển."
        action={<ButtonLink to="/learning-path">Xem lộ trình</ButtonLink>}
      />
    );
  }

  if (status === 'locked') {
    return (
      <>
        <PageHeader title={lesson.titleVi} backTo={`/modules/${lesson.moduleId}`} />
        <EmptyState
          icon={<Lock className="size-7" />}
          title="Bài học chưa mở khoá"
          description="Hãy hoàn thành bài trước trong chủ đề này để mở khoá."
          action={<ButtonLink to={`/modules/${lesson.moduleId}`}>Về chủ đề</ButtonLink>}
        />
      </>
    );
  }

  const completed = status === 'completed';
  const siblings = moduleLessonsQuery.data ?? [];
  const nextLesson = siblings[siblings.findIndex((l) => l.id === lesson.id) + 1];

  const onComplete = () => {
    const xp = completeLesson(lesson);
    // First completion on this device: let the server validate it and award XP (no-op for guests).
    if (xp > 0) void syncLessonCompleted(lesson.id);
    if (xp > 0) toast.success(`Hoàn thành bài học! +${xp} XP`);
    navigate(nextLesson ? `/lessons/${nextLesson.id}` : `/modules/${lesson.moduleId}`);
  };

  return (
    <article className="animate-fade-up pb-4">
      <PageHeader
        title={lesson.titleVi}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <LevelBadge level={lesson.levelId} />
            <span>{lesson.title}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {lesson.estimatedMinutes} phút
            </span>
          </span>
        }
        backTo={`/modules/${lesson.moduleId}`}
      />

      <section className="mb-6 rounded-card bg-secondary-soft p-4" aria-labelledby="objectives">
        <h2 id="objectives" className="flex items-center gap-2 text-sm font-bold text-secondary">
          <Target className="size-4" aria-hidden /> Mục tiêu bài học
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {lesson.objectives.map((o) => (
            <li key={o} className="flex gap-2 text-[15px]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
              {o}
            </li>
          ))}
        </ul>
      </section>

      <ContentBlocks blocks={lesson.blocks} lessonId={lesson.id} />

      <div className="sticky bottom-0 mt-8 bg-gradient-to-t from-bg from-70% pt-6 pb-[env(safe-area-inset-bottom)]">
        {completed ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" aria-hidden /> Bạn đã hoàn thành bài này
            </p>
            {nextLesson ? (
              <ButtonLink to={`/lessons/${nextLesson.id}`} size="lg" fullWidth>
                Bài tiếp theo
              </ButtonLink>
            ) : (
              <ButtonLink to={`/modules/${lesson.moduleId}`} variant="outline" size="lg" fullWidth>
                Về chủ đề
              </ButtonLink>
            )}
          </div>
        ) : (
          <Button size="lg" fullWidth onClick={onComplete} leftIcon={<CheckCircle2 className="size-5" />}>
            Hoàn thành bài học
          </Button>
        )}
      </div>
    </article>
  );
}
