import { Navigate, Outlet, useLocation } from 'react-router';
import { PageSkeleton } from '@/components/ui/States';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';

/** The learner must finish onboarding (as a guest or signed in) before entering the app. */
export function RequireOnboarding() {
  const onboarded = useProgressStore((s) => s.profile.onboarded);
  const location = useLocation();
  if (!onboarded) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RootRedirect() {
  const onboarded = useProgressStore((s) => s.profile.onboarded);
  return <Navigate to={onboarded ? '/dashboard' : '/welcome'} replace />;
}

/** Routes that need an account. Waits for the session to be restored before deciding. */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <PageSkeleton />;
  if (status !== 'signed_in') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

