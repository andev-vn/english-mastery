import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/cn';
import { isNavActive, mainNavigation } from './navigation';

/** Fixed mobile/tablet navigation. Hidden on desktop (lg+) where the side rail takes over. */
export function BottomNavigation() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-safe backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {mainNavigation.map(({ to, label, icon: Icon, match }) => {
          const active = isNavActive(pathname, match);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-text-muted hover:text-text',
                )}
              >
                <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-primary-soft')}>
                  <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
