import type { Assessment, Exercise, GrammarTopic, Lesson, LevelInfo, Module, SkillActivity, VocabularyEntry, VocabularyTopic } from '@/types/content';

/** The complete published content, from either the bundled files or Supabase. */
export interface ContentDataset {
  levels: LevelInfo[];
  modules: Module[];
  lessons: Lesson[];
  vocabulary: VocabularyEntry[];
  vocabularyTopics: VocabularyTopic[];
  exercises: Exercise[];
  grammarTopics: GrammarTopic[];
  assessments: Assessment[];
  activities: SkillActivity[];
}

/** Bundled content, loaded lazily so it is code-split from the app shell (and precached for offline use). */
export async function loadBundledDataset(): Promise<ContentDataset> {
  const [curriculum, lessons, vocabulary, exercises, grammar, assessments, activities] = await Promise.all([
    import('@/data/curriculum'),
    import('@/data/lessons'),
    import('@/data/vocabulary'),
    import('@/data/exercises'),
    import('@/data/grammar'),
    import('@/data/assessments'),
    import('@/data/activities'),
  ]);
  return {
    levels: curriculum.levels,
    modules: curriculum.modules,
    lessons: lessons.lessons,
    vocabulary: vocabulary.vocabulary,
    vocabularyTopics: vocabulary.vocabularyTopics,
    exercises: exercises.exercises,
    grammarTopics: grammar.grammarTopics,
    assessments: assessments.assessments,
    activities: activities.activities,
  };
}
