import { CheckCircle2, ChevronRight, Clock, Lock, PlayCircle } from 'lucide-react';
import { Link } from 'react-router';
import { LevelBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { Lesson } from '@/types/content';
import type { LessonStatus } from '@/types/progress';

const statusMeta: Record<LessonStatus, { label: string; icon: typeof Lock; className: string }> = {
  locked: { label: 'Chưa mở khoá', icon: Lock, className: 'bg-surface-muted text-text-muted' },
  available: { label: 'Bắt đầu', icon: PlayCircle, className: 'bg-primary-soft text-primary' },
  in_progress: { label: 'Đang học', icon: PlayCircle, className: 'bg-warning-soft text-warning' },
  completed: { label: 'Đã hoàn thành', icon: CheckCircle2, className: 'bg-success-soft text-success' },
};

interface LessonCardProps {
  lesson: Lesson;
  status: LessonStatus;
  index?: number;
  showLevel?: boolean;
}

export function LessonCard({ lesson, status, index, showLevel }: LessonCardProps) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  const locked = status === 'locked';

  const body = (
    <>
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', meta.className)} aria-hidden>
        {index !== undefined && status !== 'completed' && !locked ? (
          <span className="text-base font-bold">{index}</span>
        ) : (
          <Icon className="size-6" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{lesson.titleVi}</span>
          {showLevel && <LevelBadge level={lesson.levelId} />}
        </span>
        <span className="truncate text-sm text-text-muted">{lesson.title}</span>
        <span className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {lesson.estimatedMinutes} phút
          </span>
          <span className={cn('font-medium', status === 'completed' && 'text-success', status === 'in_progress' && 'text-warning')}>
            {meta.label}
          </span>
        </span>
      </span>
      {!locked && <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />}
    </>
  );

  const classes = 'flex items-center gap-3.5 rounded-card border border-border/70 bg-surface p-3.5 shadow-card';

  if (locked) {
    return (
      <div className={cn(classes, 'opacity-70')} aria-disabled="true" title="Hoàn thành bài trước để mở khoá">
        {body}
      </div>
    );
  }
  return (
    <Link to={`/lessons/${lesson.id}`} className={cn(classes, 'transition-[border-color,transform] hover:border-primary/40 active:scale-[0.99]')}>
      {body}
    </Link>
  );
}
