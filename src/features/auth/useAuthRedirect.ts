import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { safeNextPath } from '@/services/auth/authService';
import { syncProfileOnSignIn } from '@/services/accountSync';

/**
 * After a successful sign-in: reconcile the profile first (so onboarding state is known),
 * then go to the requested page. Profile sync failures do not block signing in.
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('redirect'));

  const finish = useCallback(
    async (userId: string | null) => {
      if (userId) await syncProfileOnSignIn(userId).catch(() => undefined);
      navigate(next, { replace: true });
    },
    [navigate, next],
  );

  return { next, finish };
}
