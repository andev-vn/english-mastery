import { useMemo } from 'react';
import { useLessons, useModules } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import type { Lesson, Module } from '@/types/content';

export interface ModuleSummary {
  module: Module;
  lessons: Lesson[];
  completed: number;
  percent: number;
}

/** Joins modules, lessons and local progress into per-module summaries. */
export function useModuleSummaries() {
  const modulesQuery = useModules();
  const lessonsQuery = useLessons();
  const progress = useProgressStore((s) => s.lessons);

  const summaries = useMemo<ModuleSummary[] | undefined>(() => {
    if (!modulesQuery.data || !lessonsQuery.data) return undefined;
    return modulesQuery.data.map((module) => {
      const lessons = lessonsQuery.data.filter((l) => l.moduleId === module.id).sort((a, b) => a.order - b.order);
      const completed = lessons.filter((l) => progress[l.id]?.status === 'completed').length;
      return { module, lessons, completed, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0 };
    });
  }, [modulesQuery.data, lessonsQuery.data, progress]);

  return {
    summaries,
    isPending: modulesQuery.isPending || lessonsQuery.isPending,
    isError: modulesQuery.isError || lessonsQuery.isError,
    refetch: () => {
      void modulesQuery.refetch();
      void lessonsQuery.refetch();
    },
  };
}
