import type { LearnerProfile } from '@/types/progress';

export type ProfileSyncAction = 'push' | 'pull' | 'none';

/**
 * Decides how to reconcile the on-device profile with the account profile after sign-in.
 * Never silently overwrites newer data with older data:
 * - Only one side has completed onboarding → that side wins (links a guest profile to a new account,
 *   or restores an existing account on a new device).
 * - Both onboarded → the most recently updated side wins.
 */
export function decideProfileSync(
  local: Pick<LearnerProfile, 'onboarded' | 'updatedAt'>,
  remote: { onboarded: boolean; updatedAt: string } | null,
): ProfileSyncAction {
  if (!remote) return local.onboarded ? 'push' : 'none';
  if (local.onboarded && !remote.onboarded) return 'push';
  if (!local.onboarded && remote.onboarded) return 'pull';
  if (!local.onboarded && !remote.onboarded) return 'none';
  const localTime = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  const remoteTime = Date.parse(remote.updatedAt);
  if (localTime > remoteTime) return 'push';
  if (remoteTime > localTime) return 'pull';
  return 'none';
}
