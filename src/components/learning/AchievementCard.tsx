import { BookOpen, Brain, Flame, Footprints, Lock, Target, Trophy } from 'lucide-react';
import { ProgressBar } from '@/components/ui/Progress';
import { cn } from '@/lib/cn';
import type { AchievementIcon } from '@/data/achievements';
import type { AchievementStatus } from '@/lib/progress';

const icons: Record<AchievementIcon, typeof Trophy> = {
  footprints: Footprints,
  flame: Flame,
  'book-open': BookOpen,
  target: Target,
  brain: Brain,
  trophy: Trophy,
};

export function AchievementCard({ status, compact }: { status: AchievementStatus; compact?: boolean }) {
  const { definition, value, unlocked } = status;
  const Icon = unlocked ? icons[definition.icon] : Lock;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border border-border/70 bg-surface shadow-card',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl',
          unlocked ? 'bg-warning-soft text-warning' : 'bg-surface-muted text-text-muted',
        )}
        aria-hidden
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{definition.title}</p>
        <p className="truncate text-sm text-text-muted">{definition.description}</p>
        {!unlocked && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={(value / definition.goal) * 100} size="sm" tone="warning" label={`Tiến độ ${definition.title}`} />
            <span className="shrink-0 text-xs text-text-muted tabular-nums">
              {value}/{definition.goal}
            </span>
          </div>
        )}
      </div>
      {unlocked && <span className="sr-only">Đã mở khoá</span>}
    </div>
  );
}
