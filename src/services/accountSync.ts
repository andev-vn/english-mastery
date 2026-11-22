import { decideProfileSync } from '@/lib/profileSync';
import { fetchProfile, saveProfile } from '@/services/profileRepository';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Links the on-device (guest) profile with the signed-in account.
 * Scope today: profile + daily goal. Learning progress sync (lessons, SRS, XP) arrives with the
 * offline sync queue in Phase 6 — until then progress stays on this device.
 */

const inflight = new Map<string, Promise<void>>();

function localSnapshot() {
  const { profile } = useProgressStore.getState();
  return {
    displayName: profile.displayName,
    level: profile.level,
    goal: profile.goal,
    onboarded: profile.onboarded,
    dailyGoalMinutes: useSettingsStore.getState().dailyGoalMinutes,
  };
}

async function push(userId: string) {
  const updatedAt = await saveProfile(userId, localSnapshot());
  useProgressStore.getState().markProfileSynced(updatedAt);
}

/** Reconciles once per sign-in. Concurrent calls for the same user share one request. */
export function syncProfileOnSignIn(userId: string): Promise<void> {
  const existing = inflight.get(userId);
  if (existing) return existing;
  const task = (async () => {
    const remote = await fetchProfile(userId);
    const local = useProgressStore.getState().profile;
    const action = decideProfileSync(local, remote);
    if (action === 'push') await push(userId);
    if (action === 'pull' && remote) {
      useProgressStore.getState().applyRemoteProfile(
        { displayName: remote.displayName, level: remote.level, goal: remote.goal, onboarded: remote.onboarded },
        remote.updatedAt,
      );
      useSettingsStore.getState().setDailyGoal(remote.dailyGoalMinutes);
    }
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

/**
 * While signed in, pushes later local profile edits (debounced).
 * Returns an unsubscribe function.
 */
export function watchProfileChanges(userId: string, onError: (error: unknown) => void): () => void {
  let timer: number | undefined;
  let last = JSON.stringify(localSnapshot());
  const schedule = () => {
    const next = JSON.stringify(localSnapshot());
    if (next === last) return;
    last = next;
    if (!useProgressStore.getState().profile.onboarded) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      push(userId).catch(onError);
    }, 800);
  };
  const unsubProgress = useProgressStore.subscribe(schedule);
  const unsubSettings = useSettingsStore.subscribe(schedule);
  return () => {
    window.clearTimeout(timer);
    unsubProgress();
    unsubSettings();
  };
}
