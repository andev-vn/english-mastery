import { Navigate, Outlet, useLocation } from 'react-router';
import { useProgressStore } from '@/stores/progressStore';

/** Guest mode: the learner must finish onboarding before entering the app. Auth guards arrive in Phase 2. */
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
