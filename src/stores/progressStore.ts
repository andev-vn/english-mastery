import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toDayKey } from '@/lib/date';
import { uid } from '@/lib/cn';
import { createCard, isDue, scheduleReview, type ReviewGrade } from '@/lib/srs';
import { exerciseXp, XP_LESSON_COMPLETE, XP_PER_DUE_REVIEW } from '@/lib/xp';
import type { ActivityEntry, ExerciseAttempt, LearnerProfile, LessonProgress, ReviewCard } from '@/types/progress';

/**
 * Local (guest) learning progress.
 * Phase 1 persists to localStorage; Phase 6 moves this to IndexedDB with a sync queue to Supabase.
 */
export interface ProgressState {
  profile: LearnerProfile;
  lessons: Record<string, LessonProgress>;
  attempts: ExerciseAttempt[];
  cards: Record<string, ReviewCard>;
  /** Words removed on this device (wordId → ISO time), so a sync cannot bring them back. */
  removedWords: Record<string, string>;
  activity: ActivityEntry[];
  /** Minutes studied per local day (YYYY-MM-DD). */
  studyDays: Record<string, number>;
  totalXp: number;
  xpByDay: Record<string, number>;

  completeOnboarding: (profile: Omit<LearnerProfile, 'onboarded' | 'updatedAt'>) => void;
  updateProfile: (patch: Partial<Omit<LearnerProfile, 'onboarded' | 'updatedAt'>>) => void;
  /** Replaces the profile with the account's version (after sign-in on another device). */
  applyRemoteProfile: (profile: Omit<LearnerProfile, 'updatedAt'>, updatedAt: string) => void;
  /** Records that the local profile now matches the server version. */
  markProfileSynced: (updatedAt: string) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: (lesson: { id: string; title: string; estimatedMinutes: number }) => number;
  recordExercise: (input: {
    exerciseId: string;
    title: string;
    correct: number;
    total: number;
    durationSeconds: number;
  }) => { xp: number; attempt: ExerciseAttempt };
  saveWord: (wordId: string) => void;
  removeWord: (wordId: string) => void;
  toggleFavorite: (wordId: string) => void;
  reviewWord: (wordId: string, grade: ReviewGrade) => number;
  finishReviewSession: (input: { reviewed: number; xp: number; durationSeconds: number }) => void;
  /** Applies the result of merging with the account; `resolved` deletions are forgotten. */
  applyMergedCards: (cards: Record<string, ReviewCard>, resolved: string[]) => void;
  resetProgress: () => void;
}

const MAX_ACTIVITY = 200;
const MAX_ATTEMPTS = 500;

const initialData = {
  profile: { displayName: '', level: 'A1', goal: 'daily', onboarded: false } satisfies LearnerProfile,
  lessons: {},
  attempts: [],
  cards: {},
  removedWords: {},
  activity: [],
  studyDays: {},
  totalXp: 0,
  xpByDay: {},
};

type Data = Pick<ProgressState, keyof typeof initialData>;

/** Adds study minutes and XP for today. */
function addStudy(state: Data, minutes: number, xp: number, now: Date): Partial<Data> {
  const day = toDayKey(now);
  return {
    studyDays: { ...state.studyDays, [day]: (state.studyDays[day] ?? 0) + minutes },
    totalXp: state.totalXp + xp,
    xpByDay: { ...state.xpByDay, [day]: (state.xpByDay[day] ?? 0) + xp },
  };
}

function logActivity(state: Data, entry: Omit<ActivityEntry, 'id' | 'at'>, now: Date): Partial<Data> {
  return {
    activity: [{ ...entry, id: uid(), at: now.toISOString() }, ...state.activity].slice(0, MAX_ACTIVITY),
    ...addStudy(state, entry.minutes, entry.xp, now),
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialData,

      completeOnboarding: (profile) => set({ profile: { ...profile, onboarded: true, updatedAt: new Date().toISOString() } }),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch, updatedAt: new Date().toISOString() } })),

      applyRemoteProfile: (profile, updatedAt) => set({ profile: { ...profile, updatedAt } }),

      markProfileSynced: (updatedAt) => set((s) => ({ profile: { ...s.profile, updatedAt } })),

      startLesson: (lessonId) =>
        set((s) => {
          if (s.lessons[lessonId]) return s;
          return {
            lessons: {
              ...s.lessons,
              [lessonId]: { lessonId, status: 'in_progress', progressPercent: 0, updatedAt: new Date().toISOString() },
            },
          };
        }),

      completeLesson: (lesson) => {
        const state = get();
        if (state.lessons[lesson.id]?.status === 'completed') return 0;
        const now = new Date();
        set({
          lessons: {
            ...state.lessons,
            [lesson.id]: {
              lessonId: lesson.id,
              status: 'completed',
              progressPercent: 100,
              completedAt: now.toISOString(),
              updatedAt: now.toISOString(),
            },
          },
          ...logActivity(
            state,
            { kind: 'lesson', refId: lesson.id, title: lesson.title, xp: XP_LESSON_COMPLETE, minutes: lesson.estimatedMinutes },
            now,
          ),
        });
        return XP_LESSON_COMPLETE;
      },

      recordExercise: ({ exerciseId, title, correct, total, durationSeconds }) => {
        const state = get();
        const now = new Date();
        const previousBest = state.attempts
          .filter((a) => a.exerciseId === exerciseId)
          .reduce((best, a) => Math.max(best, a.correct), 0);
        const xp = exerciseXp(correct, total, previousBest);
        const attempt: ExerciseAttempt = {
          id: uid(),
          exerciseId,
          correct,
          total,
          score: total === 0 ? 0 : Math.round((correct / total) * 100),
          durationSeconds,
          completedAt: now.toISOString(),
        };
        const minutes = Math.max(1, Math.round(durationSeconds / 60));
        set({
          attempts: [attempt, ...state.attempts].slice(0, MAX_ATTEMPTS),
          ...logActivity(state, { kind: 'exercise', refId: exerciseId, title, xp, minutes }, now),
        });
        return { xp, attempt };
      },

      saveWord: (wordId) =>
        set((s) => {
          if (s.cards[wordId]) return s;
          const now = new Date();
          const { [wordId]: _tombstone, ...removedWords } = s.removedWords;
          return { cards: { ...s.cards, [wordId]: { ...createCard(wordId, now), updatedAt: now.toISOString() } }, removedWords };
        }),

      removeWord: (wordId) =>
        set((s) => {
          const { [wordId]: _removed, ...rest } = s.cards;
          return { cards: rest, removedWords: { ...s.removedWords, [wordId]: new Date().toISOString() } };
        }),

      toggleFavorite: (wordId) =>
        set((s) => {
          const now = new Date();
          const card = s.cards[wordId] ?? createCard(wordId, now);
          const { [wordId]: _tombstone, ...removedWords } = s.removedWords;
          return {
            cards: { ...s.cards, [wordId]: { ...card, favorite: !card.favorite, updatedAt: now.toISOString() } },
            removedWords,
          };
        }),

      reviewWord: (wordId, grade) => {
        const state = get();
        const now = new Date();
        const card = state.cards[wordId] ?? createCard(wordId, now);
        const wasDue = isDue(card, now);
        const next = { ...scheduleReview(card, grade, now), updatedAt: now.toISOString() };
        // XP only for due cards recalled successfully — re-reviewing early earns nothing.
        const xp = wasDue && grade !== 'again' ? XP_PER_DUE_REVIEW : 0;
        set({ cards: { ...state.cards, [wordId]: next }, ...addStudy(state, 0, xp, now) });
        return xp;
      },

      finishReviewSession: ({ reviewed, xp, durationSeconds }) => {
        if (reviewed === 0) return;
        const state = get();
        const now = new Date();
        const minutes = Math.max(1, Math.round(durationSeconds / 60));
        // XP was already granted per card; log the session for history and study time only.
        set({
          activity: [
            { id: uid(), kind: 'review' as const, refId: 'review-session', title: `Ôn tập ${reviewed} từ vựng`, xp, minutes, at: now.toISOString() },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY),
          ...addStudy(state, minutes, 0, now),
        });
      },

      applyMergedCards: (cards, resolved) =>
        set((s) => {
          const removedWords = { ...s.removedWords };
          for (const wordId of resolved) delete removedWords[wordId];
          return { cards, removedWords };
        }),

      resetProgress: () => set({ ...initialData }),
    }),
    {
      name: 'em-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): Data => ({
        profile: s.profile,
        lessons: s.lessons,
        attempts: s.attempts,
        cards: s.cards,
        removedWords: s.removedWords,
        activity: s.activity,
        studyDays: s.studyDays,
        totalXp: s.totalXp,
        xpByDay: s.xpByDay,
      }),
    },
  ),
);
