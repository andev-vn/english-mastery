import { useParams } from 'react-router';
import { useActivity, useVocabulary } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import type { Skill, SkillActivity } from '@/types/content';

/** Loads the activity from the URL and narrows it to the expected skill. */
export function useActivityPage<S extends Skill>(skill: S) {
  const { activityId = '' } = useParams();
  const query = useActivity(activityId);
  const vocabQuery = useVocabulary();
  const progress = useProgressStore((s) => s.activityProgress[activityId]);
  const activity = query.data && query.data.skill === skill ? (query.data as Extract<SkillActivity, { skill: S }>) : null;
  return {
    activity,
    isPending: query.isPending || vocabQuery.isPending,
    isError: query.isError || vocabQuery.isError,
    refetch: () => {
      void query.refetch();
      void vocabQuery.refetch();
    },
    vocabulary: vocabQuery.data ?? [],
    progress,
  };
}
