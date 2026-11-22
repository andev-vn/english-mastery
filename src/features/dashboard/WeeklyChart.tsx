import { cn } from '@/lib/cn';
import { toDayKey, weekdayShort } from '@/lib/date';

interface WeeklyChartProps {
  data: { day: string; minutes: number }[];
  goalMinutes: number;
}

/** Minutes studied over the last 7 days. Bars reaching the goal are highlighted. */
export function WeeklyChart({ data, goalMinutes }: WeeklyChartProps) {
  const max = Math.max(goalMinutes, ...data.map((d) => d.minutes), 1);
  const today = toDayKey();
  const goalPct = (goalMinutes / max) * 100;

  return (
    <figure>
      <div className="relative flex h-32 items-end gap-2" aria-hidden>
        <div className="absolute inset-x-0 border-t border-dashed border-border" style={{ bottom: `${goalPct}%` }} />
        {data.map(({ day, minutes }) => {
          const reached = minutes >= goalMinutes;
          return (
            <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              {minutes > 0 && <span className="text-[10px] font-semibold text-text-muted tabular-nums">{minutes}</span>}
              <div
                className={cn(
                  'w-full max-w-9 rounded-lg transition-[height] duration-500',
                  minutes === 0 ? 'bg-surface-muted' : reached ? 'bg-success' : 'bg-primary/70',
                )}
                style={{ height: minutes === 0 ? 6 : `${Math.max(8, (minutes / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden>
        {data.map(({ day }) => (
          <span key={day} className={cn('flex-1 text-center text-xs', day === today ? 'font-bold text-text' : 'text-text-muted')}>
            {weekdayShort(day)}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        Số phút học 7 ngày qua: {data.map((d) => `${weekdayShort(d.day)} ${d.minutes} phút`).join(', ')}. Mục tiêu {goalMinutes} phút mỗi ngày.
      </figcaption>
    </figure>
  );
}
