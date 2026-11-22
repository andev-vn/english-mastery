import type { Exercise, GrammarTopic, Lesson, LevelInfo, Module, VocabularyEntry, VocabularyTopic } from '@/types/content';

/** The complete published content, from either the bundled files or Supabase. */
export interface ContentDataset {
  levels: LevelInfo[];
  modules: Module[];
  lessons: Lesson[];
  vocabulary: VocabularyEntry[];
  vocabularyTopics: VocabularyTopic[];
  exercises: Exercise[];
  grammarTopics: GrammarTopic[];
}

/** Bundled content, loaded lazily so it is code-split from the app shell (and precached for offline use). */
export async function loadBundledDataset(): Promise<ContentDataset> {
  const [curriculum, lessons, vocabulary, exercises, grammar] = await Promise.all([
    import('@/data/curriculum'),
    import('@/data/lessons'),
    import('@/data/vocabulary'),
    import('@/data/exercises'),
    import('@/data/grammar'),
  ]);
  return {
    levels: curriculum.levels,
    modules: curriculum.modules,
    lessons: lessons.lessons,
    vocabulary: vocabulary.vocabulary,
    vocabularyTopics: vocabulary.vocabularyTopics,
    exercises: exercises.exercises,
    grammarTopics: grammar.grammarTopics,
  };
}
