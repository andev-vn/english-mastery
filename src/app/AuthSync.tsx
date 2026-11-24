import { useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { syncProfileOnSignIn, watchProfileChanges } from '@/services/accountSync';
import { syncVocabularyOnSignIn, watchVocabularyChanges } from '@/services/learningSync';
import { syncProgressOnSignIn } from '@/services/progressSync';
import { getSupabase } from '@/services/supabase/client';
import { setRejectedListener, startSyncQueue } from '@/services/sync/syncQueue';
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
      toast.error('Chưa đồng bộ được dữ liệu với tài khoản. Ứng dụng sẽ thử lại lần sau.');
    };

    let lastRejectedToast = 0;
    setRejectedListener(() => {
      // Rare (e.g. content that was unpublished): the progress is still kept on this device.
      if (Date.now() - lastRejectedToast < 60_000) return;
      lastRejectedToast = Date.now();
      toast.error('Máy chủ không nhận một phần tiến độ (nội dung có thể đã thay đổi). Dữ liệu trên thiết bị vẫn được giữ.');
    });

    const onSession = (user: { id: string; email?: string | null } | null) => {
      stopWatching?.();
      stopWatching = undefined;
      if (!user) {
        setSignedOut();
        return;
      }
      setSignedIn({ id: user.id, email: user.email ?? null });
      // The queue can send operations saved earlier for this account right away.
      const stopQueue = startSyncQueue();
      let stopWatchers: (() => void) | undefined;
      let stopWaiting: (() => void) | undefined;
      stopWatching = () => {
        stopWaiting?.();
        stopWatchers?.();
        stopQueue();
      };
      const isCurrent = () => !cancelled && useAuthStore.getState().user?.id === user.id;

      const reconcile = () => {
        void Promise.allSettled([syncProfileOnSignIn(user.id), syncVocabularyOnSignIn(user.id), syncProgressOnSignIn()]).then((results) => {
          const failed = results.find((r) => r.status === 'rejected');
          if (failed) reportSyncError(failed.reason);
          // Watch for later edits only after the initial reconcile, so pulled data is not pushed back.
          if (!isCurrent()) return;
          const stopProfile = watchProfileChanges(user.id, reportSyncError);
          const stopVocabulary = watchVocabularyChanges(user.id);
          stopWatchers = () => {
            stopProfile();
            stopVocabulary();
          };
        });
      };

      // Defer: Supabase must not be called from inside its own auth callback.
      window.setTimeout(() => {
        if (!isCurrent()) return;
        if (navigator.onLine) {
          reconcile();
          return;
        }
        // Opened offline with a stored session: everything stays on the device (and changes made
        // meanwhile are queued); reconcile with the account once the connection is back.
        const onOnline = () => {
          stopWaiting?.();
          stopWaiting = undefined;
          if (isCurrent()) reconcile();
        };
        window.addEventListener('online', onOnline);
        stopWaiting = () => window.removeEventListener('online', onOnline);
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
      setRejectedListener(undefined);
    };
  }, []);

  return null;
}
