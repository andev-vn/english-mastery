import { Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { computeStreaks } from '@/lib/date';
import { useProgressStore } from '@/stores/progressStore';
import { isNavActive, mainNavigation } from './navigation';

/** Desktop-only navigation rail (lg+). Never rendered on mobile. */
export function SideNavigation() {
  const { pathname } = useLocation();
  const studyDays = useProgressStore((s) => s.studyDays);
  const totalXp = useProgressStore((s) => s.totalXp);
  const streak = computeStreaks(Object.keys(studyDays)).current;

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <Link to="/dashboard" className="mb-8 px-2">
        <Logo />
      </Link>
      <nav aria-label="Điều hướng chính">
        <ul className="flex flex-col gap-1">
          {mainNavigation.map(({ to, label, icon: Icon, match }) => {
            const active = isNavActive(pathname, match);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors',
                    active ? 'bg-primary-soft text-primary' : 'text-text-subtle hover:bg-surface-muted hover:text-text',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto rounded-2xl bg-surface-muted p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="size-4 text-warning" aria-hidden /> {streak} ngày liên tiếp
        </p>
        <p className="mt-1 text-xs text-text-muted">{totalXp} XP tích luỹ</p>
      </div>
    </aside>
  );
}
