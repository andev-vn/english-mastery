import { uid } from '@/lib/cn';
import { requireSupabase } from '@/services/supabase/client';
import type { Json } from '@/services/supabase/database.types';
import { enqueue, registerSyncHandler, RemoteError } from '@/services/sync/syncQueue';
import { useProgressStore } from '@/stores/progressStore';
import type { AnswerValue } from '@/types/content';

/**
 * Server-validated progress for signed-in users (see supabase/migrations/*_progress_rpcs.sql).
 * The device stays the immediate source of truth for the UI; every meaningful action is also sent
 * to an RPC that grades/validates it, and the server's summary is merged back (never lowering local values).
 * Signed-in actions go through the durable sync queue (services/sync/syncQueue.ts), so they are sent
 * once the device is online again. Guests: nothing is queued.
 */

export interface ProgressSummary {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  completedLessonIds: string[];
  achievementIds: string[];
  days: { day: string; minutes: number; xp: number }[];
}

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

type JsonObject = { [key: string]: Json | undefined };
const asObj = (v: Json | undefined): JsonObject => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const num = (v: Json | undefined) => (typeof v === 'number' ? v : 0);
const strs = (v: Json | undefined) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function parseSummary(data: Json): ProgressSummary {
  const o = asObj(data);
  const days = Array.isArray(o.days) ? o.days : [];
  return {
    totalXp: num(o.totalXp),
    currentStreak: num(o.currentStreak),
    bestStreak: num(o.bestStreak),
    completedLessonIds: strs(o.completedLessonIds),
    achievementIds: strs(o.achievementIds),
    days: days.map(asObj).filter((d) => typeof d.day === 'string').map((d) => ({ day: d.day as string, minutes: num(d.minutes), xp: num(d.xp) })),
  };
}

function apply(data: Json) {
  const summary = parseSummary(data);
  useProgressStore.getState().mergeServerProgress(summary);
  return summary;
}

/** Unwraps an RPC response, throwing a RemoteError that carries the HTTP status (0 = network failure). */
export function unwrap<T>({ data, error, status }: { data: T | null; error: { message: string; code?: string } | null; status: number }): T {
  if (error) throw new RemoteError(error.message, status, error.code);
  if (data === null) throw new RemoteError('Empty RPC response', status);
  return data;
}

async function completeLessonRpc(lessonId: string, opId: string, tz: string): Promise<Json> {
  const supabase = await requireSupabase();
  return unwrap(await supabase.rpc('complete_lesson', { p_lesson_id: lessonId, p_op_id: opId, p_tz: tz }));
}

async function summaryRpc(): Promise<Json> {
  const supabase = await requireSupabase();
  return unwrap(await supabase.rpc('get_progress_summary', { p_tz: timeZone() }));
}

// --- queued operations ------------------------------------------------------------------------
// The time zone is captured when the action happens. The server still dates an operation by when it
// arrives, so activity done offline counts toward the server's streak on the day it syncs
// (this device's own history keeps the real day).

interface LessonPayload {
  lessonId: string;
  tz: string;
}
interface ExercisePayload {
  exerciseId: string;
  answers: Record<string, AnswerValue>;
  durationSeconds: number;
  tz: string;
}
interface ReviewPayload {
  reviewed: number;
  recalled: number;
  durationSeconds: number;
  tz: string;
}
interface AssessmentPayload {
  assessmentId: string;
  answers: Record<string, AnswerValue>;
  durationSeconds: number;
  tz: string;
}

registerSyncHandler<LessonPayload>('complete_lesson', async (p, item) => {
  apply(await completeLessonRpc(p.lessonId, item.opId, p.tz));
});

registerSyncHandler<ExercisePayload>('submit_exercise', async (p, item) => {
  const supabase = await requireSupabase();
  apply(
    unwrap(
      await supabase.rpc('submit_exercise', {
        p_exercise_id: p.exerciseId,
        p_answers: p.answers as unknown as Json,
        p_duration_seconds: p.durationSeconds,
        p_op_id: item.opId,
        p_tz: p.tz,
      }),
    ),
  );
});

registerSyncHandler<ReviewPayload>('record_reviews', async (p, item) => {
  const supabase = await requireSupabase();
  apply(
    unwrap(
      await supabase.rpc('record_reviews', {
        p_reviewed: p.reviewed,
        p_recalled: p.recalled,
        p_duration_seconds: p.durationSeconds,
        p_op_id: item.opId,
        p_tz: p.tz,
      }),
    ),
  );
});

registerSyncHandler<AssessmentPayload>('submit_assessment', async (p, item) => {
  const supabase = await requireSupabase();
  // The server scores the test again; the device already shows its own result.
  unwrap(
    await supabase.rpc('submit_assessment', {
      p_assessment_id: p.assessmentId,
      p_answers: p.answers as unknown as Json,
      p_duration_seconds: p.durationSeconds,
      p_op_id: item.opId,
      p_tz: p.tz,
    }),
  );
});

/** After a lesson is completed on this device. Returns false for guests. */
export function syncLessonCompleted(lessonId: string): Promise<boolean> {
  return enqueue('complete_lesson', { lessonId, tz: timeZone() } satisfies LessonPayload);
}

/** After an exercise is finished: the server re-grades the answers and records them. */
export function syncExerciseSubmitted(input: Omit<ExercisePayload, 'tz'>): Promise<boolean> {
  return enqueue('submit_exercise', { ...input, tz: timeZone() } satisfies ExercisePayload);
}

/** After a flashcard session. */
export function syncReviewSession(input: Omit<ReviewPayload, 'tz'>): Promise<boolean> {
  if (input.reviewed === 0) return Promise.resolve(false);
  return enqueue('record_reviews', { ...input, tz: timeZone() } satisfies ReviewPayload);
}

/** Submits a placement test for server-side scoring; the local record id is the idempotency key. */
export function submitAssessment(input: Omit<AssessmentPayload, 'tz'> & { opId: string }): Promise<boolean> {
  const { opId, ...rest } = input;
  return enqueue('submit_assessment', { ...rest, tz: timeZone() } satisfies AssessmentPayload, opId);
}

/**
 * On sign-in: upload lessons completed here before the account existed (the server awards XP once
 * per lesson), then pull the account's progress so a new device shows it too.
 * Exercise attempts made as a guest cannot be uploaded: their answers were not kept.
 */
export async function syncProgressOnSignIn(): Promise<void> {
  const summary = parseSummary(await summaryRpc());
  const onServer = new Set(summary.completedLessonIds);
  const localOnly = Object.values(useProgressStore.getState().lessons)
    .filter((l) => l.status === 'completed' && !onServer.has(l.lessonId))
    .map((l) => l.lessonId);
  let latest: Json | null = null;
  for (const lessonId of localOnly) {
    try {
      latest = await completeLessonRpc(lessonId, uid(), timeZone());
    } catch (error) {
      // A lesson removed from the published content cannot be validated; skip it.
      if (import.meta.env.DEV) console.warn('[progress sync] skipped', lessonId, error);
    }
  }
  useProgressStore.getState().mergeServerProgress(latest ? parseSummary(latest) : summary);
}
