import { useSyncExternalStore, type ReactNode } from 'react';
import { useProgressStore } from '@/stores/progressStore';

const subscribe = (onChange: () => void) => useProgressStore.persist.onFinishHydration(onChange);
const hasHydrated = () => useProgressStore.persist.hasHydrated();

/**
 * Progress is read from IndexedDB asynchronously. Rendering (or syncing) before that finishes would
 * show an empty profile and could save the empty state over the learner's data, so children wait.
 * Reading IndexedDB takes a few milliseconds, so there is no loading indicator.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribe, hasHydrated, hasHydrated);
  return ready ? children : null;
}
