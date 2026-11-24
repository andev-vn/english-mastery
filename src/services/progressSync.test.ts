import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { requireSupabase, type AppSupabaseClient } from './supabase/client';
import { parseSummary, submitAssessment, syncLessonCompleted, syncProgressOnSignIn } from './progressSync';

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
  const spy = vi.fn(async (fn: string, args: Record<string, unknown>) => ({ data: rpc(fn, args), error: null }));
  vi.mocked(requireSupabase).mockResolvedValue({ rpc: spy } as unknown as AppSupabaseClient);
  return spy;
}

describe('progressSync', () => {
  beforeEach(() => {
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
    await syncLessonCompleted('l-a1-greetings');
    expect(await submitAssessment({ assessmentId: 'placement-v1', answers: {}, durationSeconds: 1, opId: 'x' })).toBeNull();
    expect(requireSupabase).not.toHaveBeenCalled();
  });

  it('merges server progress without lowering local values', async () => {
    useProgressStore.setState({ totalXp: 500, studyDays: { '2026-11-20': 45 }, xpByDay: { '2026-11-20': 10 } });
    fakeClient(() => summary());
    await syncLessonCompleted('l-a1-greetings');
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

  it('reports failures without throwing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(requireSupabase).mockRejectedValue(new Error('offline'));
    await expect(syncLessonCompleted('l-a1-greetings')).resolves.toBeUndefined();
  });
});
