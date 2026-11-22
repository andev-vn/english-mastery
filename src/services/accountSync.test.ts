import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { syncProfileOnSignIn } from './accountSync';
import { fetchProfile, saveProfile, type RemoteProfile } from './profileRepository';

vi.mock('./profileRepository', () => ({ fetchProfile: vi.fn(), saveProfile: vi.fn() }));

const remote = (patch: Partial<RemoteProfile>): RemoteProfile => ({
  displayName: '',
  level: 'A1',
  goal: 'daily',
  onboarded: false,
  dailyGoalMinutes: 15,
  updatedAt: '2026-11-20T00:00:00.000Z',
  ...patch,
});

describe('syncProfileOnSignIn', () => {
  beforeEach(() => {
    vi.mocked(fetchProfile).mockReset();
    vi.mocked(saveProfile).mockReset();
    useProgressStore.getState().resetProgress();
    useSettingsStore.getState().setDailyGoal(15);
  });

  it('links the guest profile to a brand-new account', async () => {
    useProgressStore.getState().completeOnboarding({ displayName: 'Lan', level: 'B1', goal: 'work' });
    useSettingsStore.getState().setDailyGoal(30);
    vi.mocked(fetchProfile).mockResolvedValue(remote({}));
    vi.mocked(saveProfile).mockResolvedValue('2026-11-23T00:00:00.000Z');

    await syncProfileOnSignIn('user-1');

    expect(saveProfile).toHaveBeenCalledWith('user-1', { displayName: 'Lan', level: 'B1', goal: 'work', onboarded: true, dailyGoalMinutes: 30 });
    expect(useProgressStore.getState().profile.updatedAt).toBe('2026-11-23T00:00:00.000Z');
  });

  it('restores the account profile on a new device', async () => {
    vi.mocked(fetchProfile).mockResolvedValue(remote({ displayName: 'Minh', level: 'C1', onboarded: true, dailyGoalMinutes: 45 }));

    await syncProfileOnSignIn('user-2');

    expect(saveProfile).not.toHaveBeenCalled();
    expect(useProgressStore.getState().profile).toMatchObject({ displayName: 'Minh', level: 'C1', onboarded: true });
    expect(useSettingsStore.getState().dailyGoalMinutes).toBe(45);
  });

  it('shares one request between concurrent calls for the same user', async () => {
    vi.mocked(fetchProfile).mockResolvedValue(remote({}));
    await Promise.all([syncProfileOnSignIn('user-3'), syncProfileOnSignIn('user-3')]);
    expect(fetchProfile).toHaveBeenCalledTimes(1);
  });

  it('propagates backend errors to the caller', async () => {
    vi.mocked(fetchProfile).mockRejectedValue(new Error('network'));
    await expect(syncProfileOnSignIn('user-4')).rejects.toThrow('network');
  });
});
