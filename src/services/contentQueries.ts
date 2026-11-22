import { useQuery } from '@tanstack/react-query';
import type { CefrLevel } from '@/types/content';
import { contentRepository } from './contentRepository';

/** Published content changes rarely, so it is cached for the whole session. */
const STATIC = { staleTime: Infinity, gcTime: Infinity } as const;

export const contentKeys = {
  levels: ['levels'] as const,
  modules: (levelId?: CefrLevel) => ['modules', levelId ?? 'all'] as const,
  module: (id: string) => ['module', id] as const,
  lessons: (filter: { moduleId?: string; levelId?: CefrLevel }) => ['lessons', filter] as const,
  lesson: (id: string) => ['lesson', id] as const,
  vocabulary: ['vocabulary'] as const,
  vocabularyTopics: ['vocabulary-topics'] as const,
  exercises: ['exercises'] as const,
  exercise: (id: string) => ['exercise', id] as const,
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
