import { useMemo } from 'react';
import { History } from 'lucide-react';
import { AchievementCard } from '@/components/learning/AchievementCard';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { formatRelative } from '@/lib/date';
import { achievementStatuses, snapshot, weeklyMinutes } from '@/lib/progress';
import { useExercises } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { WeeklyChart } from '@/features/dashboard/WeeklyChart';
import { cn } from '@/lib/cn';

export default function ProgressPage() {
  const state = useProgressStore();
  const goal = useSettingsStore((s) => s.dailyGoalMinutes);
  const exercisesQuery = useExercises();
  const snap = useMemo(() => snapshot(state), [state]);
  const week = weeklyMinutes(state);
  const weekTotal = week.reduce((n, d) => n + d.minutes, 0);
  const activeDays = week.filter((d) => d.minutes > 0).length;
  const titleOf = (id: string) => exercisesQuery.data?.find((e) => e.id === id)?.titleVi ?? id;

  const stats = [
    { label: 'Tổng XP', value: snap.totalXp },
    { label: 'Bài học hoàn thành', value: snap.completedLessons },
    { label: 'Từ đã ghi nhớ', value: snap.wordsLearned },
    { label: 'Tổng thời gian', value: `${snap.totalMinutes} phút` },
    { label: 'Chuỗi hiện tại', value: `${snap.currentStreak} ngày` },
    { label: 'Chuỗi dài nhất', value: `${snap.bestStreak} ngày` },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Tiến độ học tập" backTo="/profile" />

      <section aria-labelledby="week-stats">
        <SectionTitle id="week-stats" title="Tuần này" />
        <Card>
          <p className="mb-4 text-sm text-text-muted">
            <strong className="text-text">{weekTotal} phút</strong> trong {activeDays}/7 ngày · mục tiêu {goal} phút/ngày
          </p>
          <WeeklyChart data={week} goalMinutes={goal} />
        </Card>
      </section>

      <section aria-label="Tổng quan" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </Card>
        ))}
      </section>

      <section aria-labelledby="ach-all">
        <SectionTitle id="ach-all" title="Thành tích" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {achievementStatuses(snap).map((s) => (
            <AchievementCard key={s.definition.id} status={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="history">
        <SectionTitle id="history" title="Lịch sử luyện tập" />
        {state.attempts.length === 0 ? (
          <Card>
            <EmptyState icon={<History className="size-7" />} title="Chưa có lượt luyện tập nào" description="Kết quả các bài luyện tập sẽ được lưu ở đây." />
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-border">
              {state.attempts.slice(0, 20).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{titleOf(a.exerciseId)}</span>
                    <span className="block text-xs text-text-muted">
                      {formatRelative(a.completedAt)} · {a.correct}/{a.total} câu đúng
                    </span>
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', a.score >= 80 ? 'text-success' : a.score >= 50 ? 'text-primary' : 'text-warning')}>
                    {a.score}%
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
