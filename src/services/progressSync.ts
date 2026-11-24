import { toast } from '@/components/ui/Toast';
import { uid } from '@/lib/cn';
import { requireSupabase } from '@/services/supabase/client';
import type { Json } from '@/services/supabase/database.types';
import { asCefrLevel } from '@/services/supabase/guards';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import type { AnswerValue, CefrLevel } from '@/types/content';

/**
 * Server-validated progress for signed-in users (see supabase/migrations/*_progress_rpcs.sql).
 * The device stays the immediate source of truth for the UI; every meaningful action is also sent
 * to an RPC that grades/validates it, and the server's summary is merged back (never lowering local values).
 * Guests: every function is a no-op. Failures never block learning; offline retries arrive with Phase 6.
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

const signedInUser = () => {
  const { status, user } = useAuthStore.getState();
  return status === 'signed_in' && user ? user : null;
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

let lastErrorToast = 0;
function report(error: unknown) {
  if (import.meta.env.DEV) console.warn('[progress sync]', error);
  // At most one toast per minute: the learner's progress is still saved on the device.
  if (Date.now() - lastErrorToast > 60_000) {
    lastErrorToast = Date.now();
    toast.error('Chưa lưu được tiến độ lên tài khoản. Tiến độ vẫn được giữ trên thiết bị này.');
  }
}

function apply(data: Json) {
  const summary = parseSummary(data);
  useProgressStore.getState().mergeServerProgress(summary);
  return summary;
}

/** Unwraps an RPC response, throwing its error. */
function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error;
  if (data === null) throw new Error('Empty RPC response');
  return data;
}

async function completeLessonRpc(lessonId: string): Promise<Json> {
  const supabase = await requireSupabase();
  return unwrap(await supabase.rpc('complete_lesson', { p_lesson_id: lessonId, p_op_id: uid(), p_tz: timeZone() }));
}

async function summaryRpc(): Promise<Json> {
  const supabase = await requireSupabase();
  return unwrap(await supabase.rpc('get_progress_summary', { p_tz: timeZone() }));
}

/** After a lesson is completed on this device. */
export async function syncLessonCompleted(lessonId: string): Promise<void> {
  if (!signedInUser()) return;
  try {
    apply(await completeLessonRpc(lessonId));
  } catch (error) {
    report(error);
  }
}

/** After an exercise is finished: the server re-grades the answers and records them. */
export async function syncExerciseSubmitted(input: {
  exerciseId: string;
  answers: Record<string, AnswerValue>;
  durationSeconds: number;
}): Promise<void> {
  if (!signedInUser()) return;
  try {
    const supabase = await requireSupabase();
    apply(
      unwrap(
        await supabase.rpc('submit_exercise', {
          p_exercise_id: input.exerciseId,
          p_answers: input.answers as unknown as Json,
          p_duration_seconds: input.durationSeconds,
          p_op_id: uid(),
          p_tz: timeZone(),
        }),
      ),
    );
  } catch (error) {
    report(error);
  }
}

/** After a flashcard session. */
export async function syncReviewSession(input: { reviewed: number; recalled: number; durationSeconds: number }): Promise<void> {
  if (!signedInUser() || input.reviewed === 0) return;
  try {
    const supabase = await requireSupabase();
    apply(
      unwrap(
        await supabase.rpc('record_reviews', {
          p_reviewed: input.reviewed,
          p_recalled: input.recalled,
          p_duration_seconds: input.durationSeconds,
          p_op_id: uid(),
          p_tz: timeZone(),
        }),
      ),
    );
  } catch (error) {
    report(error);
  }
}

export interface ServerAssessmentResult {
  estimatedLevel: CefrLevel;
  masteredLevel: CefrLevel | null;
  score: number;
}

/** Submits a placement test for server-side scoring. Returns null for guests or on failure. */
export async function submitAssessment(input: {
  assessmentId: string;
  answers: Record<string, AnswerValue>;
  durationSeconds: number;
  opId: string;
}): Promise<ServerAssessmentResult | null> {
  if (!signedInUser()) return null;
  try {
    const supabase = await requireSupabase();
    const o = asObj(
      unwrap(
        await supabase.rpc('submit_assessment', {
          p_assessment_id: input.assessmentId,
          p_answers: input.answers as unknown as Json,
          p_duration_seconds: input.durationSeconds,
          p_op_id: input.opId,
          p_tz: timeZone(),
        }),
      ),
    );
    return {
      estimatedLevel: asCefrLevel(String(o.estimatedLevel)),
      masteredLevel: typeof o.masteredLevel === 'string' ? asCefrLevel(o.masteredLevel) : null,
      score: num(o.score),
    };
  } catch (error) {
    report(error);
    return null;
  }
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
      latest = await completeLessonRpc(lessonId);
    } catch (error) {
      // A lesson removed from the published content cannot be validated; skip it.
      if (import.meta.env.DEV) console.warn('[progress sync] skipped', lessonId, error);
    }
  }
  useProgressStore.getState().mergeServerProgress(latest ? parseSummary(latest) : summary);
}
