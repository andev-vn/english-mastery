import type {
  CefrLevel,
  Exercise,
  Lesson,
  LevelInfo,
  Module,
  VocabularyEntry,
  VocabularyTopic,
} from '@/types/content';

/**
 * Read access to published learning content.
 * UI code depends on this interface only; Phase 2 adds a Supabase-backed implementation
 * that falls back to the bundled local dataset when offline or unconfigured.
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
}

/** Bundled dataset, loaded lazily so content is code-split from the app shell. */
const loadCurriculum = () => import('@/data/curriculum');
const loadLessons = () => import('@/data/lessons');
const loadVocabulary = () => import('@/data/vocabulary');
const loadExercises = () => import('@/data/exercises');

export const localContentRepository: ContentRepository = {
  async getLevels() {
    return (await loadCurriculum()).levels;
  },
  async getModules(levelId) {
    const { modules } = await loadCurriculum();
    return modules.filter((m) => !levelId || m.levelId === levelId).sort((a, b) => a.order - b.order);
  },
  async getModule(moduleId) {
    return (await loadCurriculum()).modules.find((m) => m.id === moduleId);
  },
  async getLessons(filter = {}) {
    // The dataset is authored in curriculum order; only re-sort within a single module.
    const { lessons } = await loadLessons();
    const result = lessons.filter(
      (l) => (!filter.moduleId || l.moduleId === filter.moduleId) && (!filter.levelId || l.levelId === filter.levelId),
    );
    return filter.moduleId ? result.sort((a, b) => a.order - b.order) : result;
  },
  async getLesson(lessonId) {
    return (await loadLessons()).lessons.find((l) => l.id === lessonId);
  },
  async getVocabulary() {
    return (await loadVocabulary()).vocabulary;
  },
  async getVocabularyTopics() {
    return (await loadVocabulary()).vocabularyTopics;
  },
  async getExercises() {
    return (await loadExercises()).exercises;
  },
  async getExercise(exerciseId) {
    return (await loadExercises()).exercises.find((e) => e.id === exerciseId);
  },
};

export const contentRepository: ContentRepository = localContentRepository;
