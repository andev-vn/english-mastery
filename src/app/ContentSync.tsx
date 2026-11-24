import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { contentKeys } from '@/services/contentQueries';
import { refreshFromRemote } from '@/services/contentRepository';

/**
 * After the first render, loads published content from Supabase in the background (once per session)
 * and refreshes content queries if it was swapped in. Thanks to structural sharing, unchanged content
 * does not re-render. No-op without Supabase; while offline it waits for the connection to return.
 */
export function ContentSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    const run = () =>
      void refreshFromRemote().then((replaced) => {
        if (replaced && !cancelled) void queryClient.invalidateQueries({ queryKey: contentKeys.all });
      });
    // Let the first screen render from bundled content before touching the network.
    // (Safari has no requestIdleCallback.)
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const handle = hasIdle ? window.requestIdleCallback(run, { timeout: 3000 }) : globalThis.setTimeout(run, 1500);
    window.addEventListener('online', run);
    return () => {
      cancelled = true;
      window.removeEventListener('online', run);
      if (hasIdle) window.cancelIdleCallback(handle as number);
      else globalThis.clearTimeout(handle);
    };
  }, [queryClient]);

  return null;
}
