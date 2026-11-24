import { useQuery } from '@tanstack/react-query';
import type { CefrLevel, Skill } from '@/types/content';
import { contentRepository } from './contentRepository';

/** Published content changes rarely: cache for the session; ContentSync invalidates after a remote refresh. */
const STATIC = { staleTime: Infinity, gcTime: Infinity } as const;

/** Every content query key starts with 'content' so a single invalidation refreshes all of them. */
export const contentKeys = {
  all: ['content'] as const,
  levels: ['content', 'levels'] as const,
  modules: (levelId?: CefrLevel) => ['content', 'modules', levelId ?? 'all'] as const,
  module: (id: string) => ['content', 'module', id] as const,
  lessons: (filter: { moduleId?: string; levelId?: CefrLevel }) => ['content', 'lessons', filter] as const,
  lesson: (id: string) => ['content', 'lesson', id] as const,
  vocabulary: ['content', 'vocabulary'] as const,
  vocabularyTopics: ['content', 'vocabulary-topics'] as const,
  exercises: ['content', 'exercises'] as const,
  exercise: (id: string) => ['content', 'exercise', id] as const,
  grammarTopics: ['content', 'grammar-topics'] as const,
  assessment: (id: string) => ['content', 'assessment', id] as const,
  activities: (skill?: Skill) => ['content', 'activities', skill ?? 'all'] as const,
  activity: (id: string) => ['content', 'activity', id] as const,
};

export const useLevels = () =>
  useQuery({ queryKey: contentKeys.levels, queryFn: () => contentRepository.getLevels(), ...STATIC });

export const useModules = (levelId?: CefrLevel) =>
  useQuery({ queryKey: contentKeys.modules(levelId), queryFn: () => contentRepository.getModules(levelId), ...STATIC });

export const useModule = (id: string) =>
  useQuery({ queryKey: contentKeys.module(id), queryFn: () => contentRepository.getModule(id).then((m) => m ?? null), ...STATIC });

export const useLessons = (filter: { moduleId?: string; levelId?: CefrLevel } = {}) =>
  useQuery({ queryKey: contentKeys.lessons(filter), queryFn: () => contentRepository.getLessons(filter), ...STATIC });

export const useLesson = (id: string) =>
  useQuery({ queryKey: contentKeys.lesson(id), queryFn: () => contentRepository.getLesson(id).then((l) => l ?? null), ...STATIC });

export const useVocabulary = () =>
  useQuery({ queryKey: contentKeys.vocabulary, queryFn: () => contentRepository.getVocabulary(), ...STATIC });

export const useVocabularyTopics = () =>
  useQuery({ queryKey: contentKeys.vocabularyTopics, queryFn: () => contentRepository.getVocabularyTopics(), ...STATIC });

export const useExercises = () =>
  useQuery({ queryKey: contentKeys.exercises, queryFn: () => contentRepository.getExercises(), ...STATIC });

export const useExercise = (id: string) =>
  useQuery({ queryKey: contentKeys.exercise(id), queryFn: () => contentRepository.getExercise(id).then((e) => e ?? null), ...STATIC });

export const useGrammarTopics = () =>
  useQuery({ queryKey: contentKeys.grammarTopics, queryFn: () => contentRepository.getGrammarTopics(), ...STATIC });

export const useAssessment = (id: string) =>
  useQuery({ queryKey: contentKeys.assessment(id), queryFn: () => contentRepository.getAssessment(id).then((a) => a ?? null), ...STATIC });

export const useActivities = (skill?: Skill) =>
  useQuery({ queryKey: contentKeys.activities(skill), queryFn: () => contentRepository.getActivities(skill), ...STATIC });

export const useActivity = (id: string) =>
  useQuery({ queryKey: contentKeys.activity(id), queryFn: () => contentRepository.getActivity(id).then((a) => a ?? null), ...STATIC });
