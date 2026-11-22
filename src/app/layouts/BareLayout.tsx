import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PageSkeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';

/** Layout without navigation: onboarding and focused learning flows (lesson, exercise, review). */
export function BareLayout({ focus = false }: { focus?: boolean }) {
  return (
    <main
      id="main"
      className={cn(
        'mx-auto flex min-h-dvh w-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6',
        focus ? 'max-w-2xl' : 'max-w-md',
      )}
    >
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration />
    </main>
  );
}
