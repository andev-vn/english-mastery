import { useMemo } from 'react';
import { BookCheck, Brain, ChevronRight, Clock, Dumbbell, Flame, GraduationCap, Languages, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { LessonCard } from '@/components/learning/LessonCard';
import { LevelBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/Progress';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { formatRelative, greeting, toDayKey } from '@/lib/date';
import { dueCardCount, lessonStatus, recommendLessons, snapshot, todayMinutes, weeklyMinutes } from '@/lib/progress';
import { useLessons } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActivityKind } from '@/types/progress';
import { WeeklyChart } from './WeeklyChart';

const activityIcon: Record<ActivityKind, typeof BookCheck> = { lesson: BookCheck, exercise: Dumbbell, review: Brain };

export default function DashboardPage() {
  const state = useProgressStore();
  const goal = useSettingsStore((s) => s.dailyGoalMinutes);
  const lessonsQuery = useLessons();

  const snap = useMemo(() => snapshot(state), [state]);
  const today = todayMinutes(state);
  const week = weeklyMinutes(state);
  const due = dueCardCount(state);
  const xpToday = state.xpByDay[toDayKey()] ?? 0;

  const allLessons = lessonsQuery.data;
  const recommended = useMemo(() => (allLessons ? recommendLessons(allLessons, state, 3) : []), [allLessons, state]);
  const continueLesson = recommended[0];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-muted">{greeting()},</p>
          <h1 className="truncate text-2xl font-bold tracking-tight">{state.profile.displayName} 👋</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LevelBadge level={state.profile.level} className="px-3 py-1 text-sm" />
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-sm font-bold text-warning" aria-label={`Chuỗi ${snap.currentStreak} ngày`}>
            <Flame className="size-4" aria-hidden />
            {snap.currentStreak}
          </span>
        </div>
      </header>

      {/* Daily goal */}
      <Card className="flex items-center gap-5">
        <CircularProgress value={(today / goal) * 100} label="Mục tiêu hôm nay" size={84} stroke={8} tone={today >= goal ? 'success' : 'primary'}>
          <span className="text-center leading-tight">
            <span className="block text-lg font-bold tabular-nums">{today}</span>
            <span className="block text-[10px] text-text-muted">/{goal} phút</span>
          </span>
        </CircularProgress>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{today >= goal ? 'Hoàn thành mục tiêu hôm nay! 🎉' : 'Mục tiêu hôm nay'}</h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {today >= goal ? 'Tuyệt vời, hãy giữ chuỗi ngày học nhé.' : `Còn ${goal - today} phút nữa để đạt mục tiêu.`}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Zap className="size-4" aria-hidden /> +{xpToday} XP hôm nay
          </p>
        </div>
      </Card>

      {/* Continue learning */}
      <section aria-labelledby="continue-title">
        <SectionTitle id="continue-title" title="Học tiếp" />
        {lessonsQuery.isPending ? (
          <Skeleton className="h-36 rounded-card" />
        ) : lessonsQuery.isError ? (
          <Card>
            <ErrorState onRetry={() => void lessonsQuery.refetch()} />
          </Card>
        ) : continueLesson ? (
          <Link
            to={`/lessons/${continueLesson.id}`}
            className="block rounded-card bg-primary p-5 text-on-primary shadow-card transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-85">
              <GraduationCap className="size-4" aria-hidden />
              {continueLesson.levelId} · {state.lessons[continueLesson.id] ? 'Đang học' : 'Bài tiếp theo'}
            </span>
            <span className="mt-2 block text-xl font-bold">{continueLesson.titleVi}</span>
            <span className="mt-1 block text-sm opacity-85">{continueLesson.description}</span>
            <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold">
              {state.lessons[continueLesson.id] ? 'Tiếp tục' : 'Bắt đầu'} · {continueLesson.estimatedMinutes} phút
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </Link>
        ) : (
          <Card>
            <EmptyState icon={<BookCheck className="size-7" />} title="Bạn đã học hết các bài hiện có!" description="Hãy ôn lại hoặc luyện tập thêm." action={<ButtonLink to="/practice">Luyện tập</ButtonLink>} />
          </Card>
        )}
      </section>

      {/* Stats */}
      <section aria-label="Thống kê" className="grid grid-cols-3 gap-3">
        {[
          { icon: BookCheck, value: snap.completedLessons, label: 'Bài học' },
          { icon: Languages, value: snap.wordsLearned, label: 'Từ đã nhớ' },
          { icon: Clock, value: snap.totalMinutes, label: 'Phút học' },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label} padding="sm" className="flex flex-col gap-1">
            <Icon className="size-5 text-secondary" aria-hidden />
            <span className="text-xl font-bold tabular-nums">{value}</span>
            <span className="text-xs text-text-muted">{label}</span>
          </Card>
        ))}
      </section>

      {/* Reviews due */}
      <Link to={due > 0 ? '/vocabulary/review' : '/vocabulary'} className="block">
        <Card interactive className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
            <Brain className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{due > 0 ? `${due} từ cần ôn hôm nay` : 'Không có từ nào cần ôn'}</span>
            <span className="block text-sm text-text-muted">
              {due > 0 ? 'Ôn đúng lúc giúp bạn nhớ lâu hơn.' : 'Lưu từ mới trong mục Từ vựng để bắt đầu ôn tập.'}
            </span>
          </span>
          <ChevronRight className="size-5 text-text-muted" aria-hidden />
        </Card>
      </Link>

      {/* Weekly chart */}
      <section aria-labelledby="week-title">
        <SectionTitle id="week-title" title="7 ngày qua" action={<Link to="/progress" className="text-sm font-semibold text-primary">Chi tiết</Link>} />
        <Card>
          <WeeklyChart data={week} goalMinutes={goal} />
        </Card>
      </section>

      {/* Recommended */}
      {recommended.length > 1 && (
        <section aria-labelledby="rec-title">
          <SectionTitle id="rec-title" title="Gợi ý cho bạn" action={<Link to="/learning-path" className="text-sm font-semibold text-primary">Xem lộ trình</Link>} />
          <div className="flex flex-col gap-2.5">
            {recommended.slice(1).map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                showLevel
                status={lessonStatus(lesson, allLessons?.filter((l) => l.moduleId === lesson.moduleId) ?? [], state)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section aria-labelledby="activity-title">
        <SectionTitle id="activity-title" title="Hoạt động gần đây" />
        {state.activity.length === 0 ? (
          <Card padding="sm">
            <p className="px-1 py-2 text-sm text-text-muted">Chưa có hoạt động nào. Hãy bắt đầu với bài học đầu tiên!</p>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-border">
              {state.activity.slice(0, 5).map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <Icon className="size-5 shrink-0 text-text-muted" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.title}</span>
                      <span className="block text-xs text-text-muted">{formatRelative(a.at)}</span>
                    </span>
                    {a.xp > 0 && <span className="text-sm font-semibold text-primary tabular-nums">+{a.xp} XP</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
