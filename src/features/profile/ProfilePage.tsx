import { useMemo } from 'react';
import { BarChart3, ChevronRight, ClipboardCheck, Flame, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { AchievementCard } from '@/components/learning/AchievementCard';
import { LevelBadge } from '@/components/ui/Badge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/Progress';
import { achievementStatuses, snapshot } from '@/lib/progress';
import { xpLevel } from '@/lib/xp';
import { useProgressStore } from '@/stores/progressStore';
import { AccountCard } from './AccountCard';

export default function ProfilePage() {
  const state = useProgressStore();
  const snap = useMemo(() => snapshot(state), [state]);
  const xp = xpLevel(snap.totalXp);
  const statuses = achievementStatuses(snap);
  const unlocked = statuses.filter((s) => s.unlocked).length;
  const initials = state.profile.displayName.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Cá nhân" />

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-on-primary" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{state.profile.displayName}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
              <LevelBadge level={state.profile.level} /> Cấp {xp.level}
            </p>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs font-medium text-text-muted">
            <span>Cấp {xp.level}</span>
            <span className="tabular-nums">
              {xp.current}/{xp.next} XP
            </span>
          </div>
          <ProgressBar value={(xp.current / xp.next) * 100} label="Tiến độ lên cấp" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface-muted py-3 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums">
              <Flame className="size-4 text-warning" aria-hidden />
              {snap.currentStreak}
            </p>
            <p className="text-xs text-text-muted">Chuỗi ngày</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums">
              <Zap className="size-4 text-primary" aria-hidden />
              {snap.totalXp}
            </p>
            <p className="text-xs text-text-muted">Tổng XP</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{snap.bestStreak}</p>
            <p className="text-xs text-text-muted">Chuỗi dài nhất</p>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <ul className="divide-y divide-border">
          {[
            { to: '/progress', icon: BarChart3, label: 'Tiến độ học tập', hint: 'Thống kê, lịch sử và thành tích' },
            { to: '/assessments', icon: ClipboardCheck, label: 'Kiểm tra trình độ', hint: 'Bài kiểm tra xếp lớp và lịch sử kết quả' },
            { to: '/settings', icon: Settings, label: 'Cài đặt', hint: 'Giao diện, mục tiêu, trình độ' },
          ].map(({ to, icon: Icon, label, hint }) => (
            <li key={to}>
              <Link to={to} className="flex min-h-16 items-center gap-3.5 px-4 py-3 hover:bg-surface-muted/60">
                <Icon className="size-5 text-text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-sm text-text-muted">{hint}</span>
                </span>
                <ChevronRight className="size-5 text-text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="ach-title">
        <SectionTitle
          id="ach-title"
          title={`Thành tích (${unlocked}/${statuses.length})`}
          action={<Link to="/progress" className="text-sm font-semibold text-primary">Xem tất cả</Link>}
        />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[...statuses]
            .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.value / b.definition.goal - a.value / a.definition.goal)
            .slice(0, 4)
            .map((s) => (
              <AchievementCard key={s.definition.id} status={s} compact />
            ))}
        </div>
      </section>

      <AccountCard />
    </div>
  );
}
