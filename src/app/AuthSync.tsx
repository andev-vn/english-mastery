import { useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { syncProfileOnSignIn, watchProfileChanges } from '@/services/accountSync';
import { getSupabase } from '@/services/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Mirrors the Supabase session into the auth store and keeps the account profile in sync.
 * Renders nothing. Without Supabase configuration it marks auth as disabled (guest mode).
 */
export function AuthSync() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth: (() => void) | undefined;
    let stopWatching: (() => void) | undefined;
    const { setSignedIn, setSignedOut, setDisabled, setRecovering } = useAuthStore.getState();

    const reportSyncError = (error: unknown) => {
      if (import.meta.env.DEV) console.error('[account sync]', error);
      toast.error('Chưa đồng bộ được hồ sơ. Ứng dụng sẽ thử lại lần sau.');
    };

    const onSession = (user: { id: string; email?: string | null } | null) => {
      stopWatching?.();
      stopWatching = undefined;
      if (!user) {
        setSignedOut();
        return;
      }
      setSignedIn({ id: user.id, email: user.email ?? null });
      // Defer: Supabase must not be called from inside its own auth callback.
      window.setTimeout(() => {
        if (cancelled) return;
        syncProfileOnSignIn(user.id)
          .catch(reportSyncError)
          .finally(() => {
            // Watch for later edits only after the initial reconcile, so a pulled profile is not pushed back.
            if (cancelled || useAuthStore.getState().user?.id !== user.id) return;
            stopWatching?.();
            stopWatching = watchProfileChanges(user.id, reportSyncError);
          });
      }, 0);
    };

    void getSupabase().then((supabase) => {
      if (cancelled) return;
      if (!supabase) {
        setDisabled();
        return;
      }
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') setRecovering(true);
        if (event === 'USER_UPDATED' && session) {
          setSignedIn({ id: session.user.id, email: session.user.email ?? null });
          return;
        }
        // INITIAL_SESSION fires once the stored session (or an email-link code) has been processed.
        // SIGNED_IN also fires on tab focus; only react when the user actually changes.
        const current = useAuthStore.getState();
        const userChanged = current.user?.id !== session?.user.id;
        if (event === 'INITIAL_SESSION' || ((event === 'SIGNED_IN' || event === 'SIGNED_OUT') && (userChanged || current.status === 'loading'))) {
          onSession(session?.user ?? null);
        }
      });
      unsubscribeAuth = () => data.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribeAuth?.();
      stopWatching?.();
    };
  }, []);

  return null;
}
