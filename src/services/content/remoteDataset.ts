import type { AppSupabaseClient } from '@/services/supabase/client';
import { assembleDataset, type ContentRows } from './assemble';
import type { ContentDataset } from './dataset';

/** PostgREST returns at most this many rows per request by default on Supabase. */
const PAGE = 1000;

async function all<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

/** Fetches all published content (RLS already hides unpublished rows) and converts it to the app model. */
export async function fetchRemoteDataset(supabase: AppSupabaseClient): Promise<ContentDataset> {
  const [levels, modules, lessons, lessonContents, vocabularyTopics, vocabulary, exercises, questions, answerOptions, grammarTopics, assessments, assessmentQuestions, activities] =
    await Promise.all([
      all((f, t) => supabase.from('cefr_levels').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('modules').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('lessons').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('lesson_contents').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('vocabulary_topics').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('vocabulary').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('exercises').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('questions').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('answer_options').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('grammar_topics').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('assessments').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('assessment_questions').select('*').order('id').range(f, t)),
      all((f, t) => supabase.from('skill_activities').select('*').order('id').range(f, t)),
    ]);
  const rows: ContentRows = {
    levels,
    modules,
    lessons,
    lessonContents,
    vocabularyTopics,
    vocabulary,
    exercises,
    questions,
    answerOptions,
    grammarTopics,
    assessments,
    assessmentQuestions,
    activities,
  };
  return assembleDataset(rows);
}
