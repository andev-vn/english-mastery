import { getSupabase } from '@/services/supabase/client';
import type {
  CefrLevel,
  Exercise,
  GrammarTopic,
  Lesson,
  LevelInfo,
  Module,
  VocabularyEntry,
  VocabularyTopic,
} from '@/types/content';
import { loadBundledDataset, type ContentDataset } from './content/dataset';

/**
 * Read access to published learning content. UI code depends on this interface only.
 *
 * Strategy: bundled content first, Supabase in the background.
 * - Every read is served from the current dataset, which starts as the bundled content
 *   (instant, works offline, precached by the service worker).
 * - `refreshFromRemote()` fetches the published content from Supabase once per session and, if it
 *   is valid, replaces the dataset so database edits reach users without a redeploy.
 * - Any remote failure (offline, paused project, malformed rows) keeps the bundled content.
 */
export interface ContentRepository {
  getLevels(): Promise<LevelInfo[]>;
  getModules(levelId?: CefrLevel): Promise<Module[]>;
  getModule(moduleId: string): Promise<Module | undefined>;
  getLessons(filter?: { moduleId?: string; levelId?: CefrLevel }): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | undefined>;
  getVocabulary(): Promise<VocabularyEntry[]>;
  getVocabularyTopics(): Promise<VocabularyTopic[]>;
  getExercises(): Promise<Exercise[]>;
  getExercise(exerciseId: string): Promise<Exercise | undefined>;
  getGrammarTopics(): Promise<GrammarTopic[]>;
}

export type ContentSource = 'bundled' | 'remote';

let current: { data: ContentDataset; source: ContentSource } | null = null;
let bundled: Promise<ContentDataset> | null = null;

async function dataset(): Promise<ContentDataset> {
  if (current) return current.data;
  bundled ??= loadBundledDataset();
  const data = await bundled;
  current ??= { data, source: 'bundled' };
  return current.data;
}

export function contentSource(): ContentSource {
  return current?.source ?? 'bundled';
}

let refreshing: Promise<boolean> | null = null;

/**
 * Loads published content from Supabase (once per session). Resolves true when the dataset was
 * replaced, so callers can invalidate cached queries; false when bundled content stays in use.
 */
export function refreshFromRemote(timeoutMs = 10_000): Promise<boolean> {
  refreshing ??= (async () => {
    const supabase = await getSupabase();
    if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) return false;
    try {
      // Loaded on demand so the row-assembly code stays out of the app shell.
      const { fetchRemoteDataset } = await import('./content/remoteDataset');
      const remote = await Promise.race([
        fetchRemoteDataset(supabase),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Content request timed out')), timeoutMs)),
      ]);
      if (remote.lessons.length === 0 || remote.levels.length === 0) return false;
      current = { data: remote, source: 'remote' };
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[content] using bundled content:', error);
      return false;
    }
  })();
  return refreshing;
}

export const contentRepository: ContentRepository = {
  async getLevels() {
    return (await dataset()).levels;
  },
  async getModules(levelId) {
    const { modules } = await dataset();
    return modules.filter((m) => !levelId || m.levelId === levelId).sort((a, b) => a.order - b.order);
  },
  async getModule(moduleId) {
    return (await dataset()).modules.find((m) => m.id === moduleId);
  },
  async getLessons(filter = {}) {
    // Lessons are kept in curriculum order; only re-sort within a single module.
    const { lessons } = await dataset();
    const result = lessons.filter(
      (l) => (!filter.moduleId || l.moduleId === filter.moduleId) && (!filter.levelId || l.levelId === filter.levelId),
    );
    return filter.moduleId ? result.sort((a, b) => a.order - b.order) : result;
  },
  async getLesson(lessonId) {
    return (await dataset()).lessons.find((l) => l.id === lessonId);
  },
  async getVocabulary() {
    return (await dataset()).vocabulary;
  },
  async getVocabularyTopics() {
    return (await dataset()).vocabularyTopics;
  },
  async getExercises() {
    return (await dataset()).exercises;
  },
  async getExercise(exerciseId) {
    return (await dataset()).exercises.find((e) => e.id === exerciseId);
  },
  async getGrammarTopics() {
    return (await dataset()).grammarTopics;
  },
};

/** Test helper: forget the cached datasets. */
export function resetContentRepositoryForTests() {
  current = null;
  bundled = null;
  refreshing = null;
}
