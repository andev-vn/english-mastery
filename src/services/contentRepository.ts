import { getDb } from '@/lib/db';
import { getSupabase } from '@/services/supabase/client';
import type {
  Assessment,
  CefrLevel,
  Exercise,
  GrammarTopic,
  Lesson,
  LevelInfo,
  Module,
  Skill,
  SkillActivity,
  VocabularyEntry,
  VocabularyTopic,
} from '@/types/content';
import { loadBundledDataset, type ContentDataset } from './content/dataset';

/**
 * Read access to published learning content. UI code depends on this interface only.
 *
 * Strategy: local content first, Supabase in the background.
 * - Every read is served from the current dataset. It starts as the copy of the published content
 *   saved on this device (IndexedDB) after the last successful download, or else the bundled content
 *   (instant, works offline, precached by the service worker).
 * - `refreshFromRemote()` fetches the published content from Supabase once per session and, if it
 *   is valid, replaces the dataset and saves it for offline use, so database edits reach users
 *   without a redeploy and stay available offline.
 * - Any remote failure (offline, paused project, malformed rows) keeps the current content.
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
  getAssessment(assessmentId: string): Promise<Assessment | undefined>;
  getActivities(skill?: Skill): Promise<SkillActivity[]>;
  getActivity(activityId: string): Promise<SkillActivity | undefined>;
}

/** bundled = shipped with the app; cache = downloaded earlier; remote = downloaded this session. */
export type ContentSource = 'bundled' | 'cache' | 'remote';

/**
 * Bump when the shape of ContentDataset changes, so a copy saved by an older app version is ignored
 * (it is replaced by the next download).
 */
const CACHE_SCHEMA = 1;
const CACHE_ID = 'dataset';

interface CachedDataset {
  schema: number;
  data: ContentDataset;
}

let current: { data: ContentDataset; source: ContentSource; savedAt?: string } | null = null;
let initial: Promise<{ data: ContentDataset; source: ContentSource; savedAt?: string }> | null = null;

async function loadCached(): Promise<{ data: ContentDataset; savedAt: string } | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db.content.get(CACHE_ID);
    const value = row?.value as CachedDataset | undefined;
    if (!row || value?.schema !== CACHE_SCHEMA) return null;
    const { data } = value;
    if (!Array.isArray(data?.lessons) || data.lessons.length === 0 || !Array.isArray(data.levels) || data.levels.length === 0) return null;
    return { data, savedAt: row.savedAt };
  } catch {
    return null;
  }
}

async function saveCache(data: ContentDataset): Promise<string | undefined> {
  const savedAt = new Date().toISOString();
  try {
    await getDb()?.content.put({ id: CACHE_ID, value: { schema: CACHE_SCHEMA, data } satisfies CachedDataset, savedAt });
    return savedAt;
  } catch (error) {
    // Quota or private mode: the content still works for this session.
    if (import.meta.env.DEV) console.warn('[content] could not save for offline use', error);
    return undefined;
  }
}

async function dataset(): Promise<ContentDataset> {
  if (current) return current.data;
  initial ??= (async () => {
    const cached = await loadCached();
    if (cached) return { ...cached, source: 'cache' as const };
    return { data: await loadBundledDataset(), source: 'bundled' as const };
  })();
  const loaded = await initial;
  current ??= loaded;
  return current.data;
}

export function contentSource(): ContentSource {
  return current?.source ?? 'bundled';
}

export interface ContentInfo {
  source: ContentSource;
  /** When the content in use was downloaded (cache/remote). */
  savedAt?: string;
  counts: { lessons: number; vocabulary: number; exercises: number; activities: number; grammar: number };
}

export async function contentInfo(): Promise<ContentInfo> {
  const data = await dataset();
  return {
    source: current?.source ?? 'bundled',
    savedAt: current?.savedAt,
    counts: {
      lessons: data.lessons.length,
      vocabulary: data.vocabulary.length,
      exercises: data.exercises.length,
      activities: data.activities.length,
      grammar: data.grammarTopics.length,
    },
  };
}

let refreshing: Promise<boolean> | null = null;

/**
 * Loads published content from Supabase (once per session unless `force`). Resolves true when the
 * dataset was replaced, so callers can invalidate cached queries; false when the current content stays.
 */
export function refreshFromRemote(timeoutMs = 10_000, options: { force?: boolean } = {}): Promise<boolean> {
  if (options.force && refreshing) {
    const previous = refreshing;
    refreshing = null;
    return previous.then(() => refreshFromRemote(timeoutMs));
  }
  refreshing ??= (async () => {
    const supabase = await getSupabase();
    if (!supabase) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      refreshing = null; // try again when the connection is back
      return false;
    }
    try {
      // Loaded on demand so the row-assembly code stays out of the app shell.
      const { fetchRemoteDataset } = await import('./content/remoteDataset');
      const remote = await Promise.race([
        fetchRemoteDataset(supabase),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Content request timed out')), timeoutMs)),
      ]);
      if (remote.lessons.length === 0 || remote.levels.length === 0) return false;
      current = { data: remote, source: 'remote', savedAt: await saveCache(remote) };
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[content] keeping current content:', error);
      refreshing = null;
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
  async getAssessment(assessmentId) {
    return (await dataset()).assessments.find((a) => a.id === assessmentId);
  },
  async getActivities(skill) {
    return (await dataset()).activities.filter((a) => !skill || a.skill === skill);
  },
  async getActivity(activityId) {
    return (await dataset()).activities.find((a) => a.id === activityId);
  },
};

/** Test helper: forget the cached datasets. */
export function resetContentRepositoryForTests() {
  current = null;
  initial = null;
  refreshing = null;
}
