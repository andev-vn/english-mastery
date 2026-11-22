import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PageSkeleton } from '@/components/ui/States';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">
        Bỏ qua điều hướng
      </a>
      <SideNavigation />
      <main
        id="main"
        className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNavigation />
      <ScrollRestoration />
    </div>
  );
}
