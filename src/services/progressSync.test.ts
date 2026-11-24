import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDbForTests } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { requireSupabase, type AppSupabaseClient } from './supabase/client';
import { parseSummary, submitAssessment, syncLessonCompleted, syncProgressOnSignIn } from './progressSync';
import { pendingItems, processQueue, resetSyncQueueForTests, useSyncStatus } from './sync/syncQueue';

vi.mock('./supabase/client', () => ({ requireSupabase: vi.fn() }));

const summary = (patch: Record<string, unknown> = {}) => ({
  totalXp: 120,
  currentStreak: 2,
  bestStreak: 5,
  completedLessonIds: ['l-a1-greetings'],
  achievementIds: ['first-lesson'],
  days: [{ day: '2026-11-20', minutes: 30, xp: 40 }],
  ...patch,
});

function fakeClient(rpc: (fn: string, args: Record<string, unknown>) => unknown) {
  const spy = vi.fn(async (fn: string, args: Record<string, unknown>) => ({ data: rpc(fn, args), error: null, status: 200 }));
  vi.mocked(requireSupabase).mockResolvedValue({ rpc: spy } as unknown as AppSupabaseClient);
  return spy;
}

describe('progressSync', () => {
  beforeEach(async () => {
    await resetDbForTests();
    resetSyncQueueForTests();
    vi.mocked(requireSupabase).mockReset();
    useProgressStore.getState().resetProgress();
    useAuthStore.getState().setSignedIn({ id: 'u1', email: 'u1@example.test' });
  });

  it('parses server summaries defensively', () => {
    expect(parseSummary(summary())).toEqual(summary());
    expect(parseSummary(null)).toEqual({ totalXp: 0, currentStreak: 0, bestStreak: 0, completedLessonIds: [], achievementIds: [], days: [] });
    expect(parseSummary({ days: [{ day: 5 }, { day: '2026-11-21', minutes: 'x' }] }).days).toEqual([{ day: '2026-11-21', minutes: 0, xp: 0 }]);
  });

  it('does nothing for guests', async () => {
    useAuthStore.getState().setSignedOut();
    expect(await syncLessonCompleted('l-a1-greetings')).toBe(false);
    expect(await submitAssessment({ assessmentId: 'placement-v1', answers: {}, durationSeconds: 1, opId: 'x' })).toBe(false);
    expect(requireSupabase).not.toHaveBeenCalled();
    expect(await pendingItems()).toEqual([]);
  });

  it('merges server progress without lowering local values', async () => {
    useProgressStore.setState({ totalXp: 500, studyDays: { '2026-11-20': 45 }, xpByDay: { '2026-11-20': 10 } });
    fakeClient(() => summary());
    await syncLessonCompleted('l-a1-greetings');
    await processQueue();
    const s = useProgressStore.getState();
    expect(s.totalXp).toBe(500);
    expect(s.studyDays['2026-11-20']).toBe(45);
    expect(s.xpByDay['2026-11-20']).toBe(40);
    expect(s.lessons['l-a1-greetings']?.status).toBe('completed');
  });

  it('on sign-in uploads lessons completed as a guest, then restores account progress', async () => {
    useProgressStore.getState().completeLesson({ id: 'l-a1-to-be', title: 'to be', estimatedMinutes: 10 });
    const rpc = fakeClient((fn) =>
      fn === 'get_progress_summary' ? summary() : summary({ totalXp: 140, completedLessonIds: ['l-a1-greetings', 'l-a1-to-be'] }),
    );
    await syncProgressOnSignIn();
    expect(rpc.mock.calls.map(([fn]) => fn)).toEqual(['get_progress_summary', 'complete_lesson']);
    expect(rpc.mock.calls[1]![1]).toMatchObject({ p_lesson_id: 'l-a1-to-be' });
    const s = useProgressStore.getState();
    expect(Object.keys(s.lessons).sort()).toEqual(['l-a1-greetings', 'l-a1-to-be']);
    expect(s.totalXp).toBe(140);
  });

  it('keeps operations queued while the network fails, then sends them with the same op id', async () => {
    const calls: string[] = [];
    let online = false;
    const rpc = vi.fn(async (_fn: string, args: Record<string, unknown>) => {
      calls.push(String(args.p_op_id));
      return online
        ? { data: summary(), error: null, status: 200 }
        : { data: null, error: { message: 'TypeError: Failed to fetch', code: '' }, status: 0 };
    });
    vi.mocked(requireSupabase).mockResolvedValue({ rpc } as unknown as AppSupabaseClient);

    await syncLessonCompleted('l-a1-greetings');
    await processQueue();
    expect(await pendingItems()).toHaveLength(1);
    expect(useSyncStatus.getState()).toMatchObject({ pending: 1, state: 'retrying' });
    const [item] = await pendingItems();
    expect(item!.attempts).toBe(1);
    expect(item!.nextAttemptAt).toBeGreaterThan(Date.now());

    // Backoff: not retried before it is due…
    await processQueue();
    expect(calls).toHaveLength(1);
    // …unless the learner presses "Sync now".
    online = true;
    await processQueue({ force: true });
    expect(await pendingItems()).toEqual([]);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toBe(calls[1]);
    expect(useSyncStatus.getState()).toMatchObject({ pending: 0, state: 'idle' });
  });

  it('drops operations the server rejects and keeps going', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const rpc = vi.fn(async (fn: string, _args: Record<string, unknown>) =>
      fn === 'complete_lesson'
        ? { data: null, error: { message: 'Unknown lesson', code: 'P0001' }, status: 400 }
        : { data: summary(), error: null, status: 200 },
    );
    vi.mocked(requireSupabase).mockResolvedValue({ rpc } as unknown as AppSupabaseClient);
    await syncLessonCompleted('l-gone');
    await submitAssessment({ assessmentId: 'placement-v1', answers: {}, durationSeconds: 5, opId: 'a1b2' });
    await processQueue();
    expect(await pendingItems()).toEqual([]);
    expect(rpc.mock.calls.map(([fn]) => fn)).toEqual(['complete_lesson', 'submit_assessment']);
    expect(rpc.mock.calls[1]![1]).toMatchObject({ p_op_id: 'a1b2' });
    expect(useSyncStatus.getState().rejected).toBe(1);
  });

  it('never sends one account’s operations as another account', async () => {
    const rpc = fakeClient(() => summary());
    useAuthStore.getState().setSignedIn({ id: 'u1', email: null });
    // Queued while u1 is signed in, but sent only after u2 signs in on this device.
    vi.mocked(requireSupabase).mockRejectedValueOnce(new Error('offline'));
    await syncLessonCompleted('l-a1-greetings');
    await processQueue();
    useAuthStore.getState().setSignedIn({ id: 'u2', email: null });
    await processQueue({ force: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(await pendingItems()).toEqual([]);
    useAuthStore.getState().setSignedIn({ id: 'u1', email: null });
    expect(await pendingItems()).toHaveLength(1);
  });
});
