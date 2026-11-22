import { CEFR_LEVELS } from '@/types/content';
import type { ContentBlock, Exercise, Lesson, Question } from '@/types/content';
import type { Json, Tables } from '@/services/supabase/database.types';
import { asCefrLevel, asExerciseSkill, asLessonCategory, asPartOfSpeech, asQuestionType } from '@/services/supabase/guards';
import type { ContentDataset } from './dataset';

/** Raw rows of the published-content tables, as returned by Supabase. */
export interface ContentRows {
  levels: Tables<'cefr_levels'>[];
  modules: Tables<'modules'>[];
  lessons: Tables<'lessons'>[];
  lessonContents: Tables<'lesson_contents'>[];
  vocabularyTopics: Tables<'vocabulary_topics'>[];
  vocabulary: Tables<'vocabulary'>[];
  exercises: Tables<'exercises'>[];
  questions: Tables<'questions'>[];
  answerOptions: Tables<'answer_options'>[];
  grammarTopics: Tables<'grammar_topics'>[];
}

type JsonObject = { [key: string]: Json | undefined };

const BLOCK_TYPES = new Set(['heading', 'text', 'grammar', 'example', 'mistake', 'tip', 'vocabulary', 'exercise']);

function asObject(value: Json, what: string): JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  throw new TypeError(`${what} must be a JSON object`);
}
function str(obj: JsonObject, key: string): string {
  const v = obj[key];
  if (typeof v !== 'string') throw new TypeError(`Expected string at "${key}"`);
  return v;
}
function strArray(obj: JsonObject, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) throw new TypeError(`Expected string[] at "${key}"`);
  return v as string[];
}

function toBlock(json: Json): ContentBlock {
  const block = asObject(json, 'lesson block');
  if (typeof block.type !== 'string' || !BLOCK_TYPES.has(block.type)) throw new TypeError(`Unsupported block type: ${String(block.type)}`);
  // The DB check constraint and seed generator guarantee the shape per type.
  return block as unknown as ContentBlock;
}

function toQuestion(row: Tables<'questions'>, options: Tables<'answer_options'>[]): Question {
  const id = row.id.slice(row.exercise_id.length + 1); // '<exercise_id>:<key>' → '<key>'
  const base = { id, prompt: row.prompt, explanationVi: row.explanation_vi, ...(row.context ? { context: row.context } : {}) };
  const payload = asObject(row.payload, `payload of ${row.id}`);
  const type = asQuestionType(row.type);
  switch (type) {
    case 'multiple_choice': {
      const sorted = [...options].sort((a, b) => a.position - b.position);
      const correct = sorted.find((o) => o.is_correct);
      if (!correct) throw new TypeError(`No correct option for ${row.id}`);
      return { ...base, type, options: sorted.map((o) => ({ id: o.option_key, text: o.text })), correctOptionId: correct.option_key };
    }
    case 'true_false': {
      if (typeof payload.answer !== 'boolean') throw new TypeError(`Expected boolean answer for ${row.id}`);
      return { ...base, type, statement: str(payload, 'statement'), answer: payload.answer };
    }
    case 'fill_blank':
    case 'error_correction':
      return { ...base, type, sentence: str(payload, 'sentence'), acceptedAnswers: strArray(payload, 'acceptedAnswers') };
    case 'translation':
      return { ...base, type, sourceVi: str(payload, 'sourceVi'), acceptedAnswers: strArray(payload, 'acceptedAnswers') };
    case 'ordering':
      return { ...base, type, tokens: strArray(payload, 'tokens') };
    case 'matching': {
      const pairs = payload.pairs;
      if (!Array.isArray(pairs)) throw new TypeError(`Expected pairs for ${row.id}`);
      return {
        ...base,
        type,
        pairs: pairs.map((p) => {
          const pair = asObject(p, 'matching pair');
          return { left: str(pair, 'left'), right: str(pair, 'right') };
        }),
      };
    }
  }
}

const groupBy = <T, K>(items: T[], key: (item: T) => K) => {
  const map = new Map<K, T[]>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return map;
};

/**
 * Converts database rows into the app's content model (the same shape as the bundled data),
 * validating enum columns and JSON payloads. Throws on malformed data.
 */
export function assembleDataset(rows: ContentRows): ContentDataset {
  const levelIdx = (id: string) => CEFR_LEVELS.indexOf(asCefrLevel(id));
  const moduleOrder = new Map(rows.modules.map((m) => [m.id, m.sort_order]));
  const blocksByLesson = groupBy(rows.lessonContents, (c) => c.lesson_id);
  const questionsByExercise = groupBy(rows.questions, (q) => q.exercise_id);
  const optionsByQuestion = groupBy(rows.answerOptions, (o) => o.question_id);

  const lessons: Lesson[] = rows.lessons
    .filter((l) => l.is_published)
    .map((l) => ({
      id: l.id,
      moduleId: l.module_id,
      levelId: asCefrLevel(l.level_id),
      title: l.title,
      titleVi: l.title_vi,
      description: l.description,
      objectives: l.objectives,
      blocks: [...(blocksByLesson.get(l.id) ?? [])].sort((a, b) => a.position - b.position).map((c) => toBlock(c.block)),
      vocabularyIds: l.vocabulary_ids,
      exerciseIds: l.exercise_ids,
      estimatedMinutes: l.estimated_minutes,
      order: l.sort_order,
    }))
    .sort(
      (a, b) =>
        levelIdx(a.levelId) - levelIdx(b.levelId) ||
        (moduleOrder.get(a.moduleId) ?? 0) - (moduleOrder.get(b.moduleId) ?? 0) ||
        a.order - b.order,
    );

  const exercises: Exercise[] = rows.exercises
    .filter((e) => e.is_published)
    .map((e) => ({
      id: e.id,
      title: e.title,
      titleVi: e.title_vi,
      level: asCefrLevel(e.level_id),
      skill: asExerciseSkill(e.skill),
      description: e.description,
      estimatedMinutes: e.estimated_minutes,
      questions: [...(questionsByExercise.get(e.id) ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((q) => toQuestion(q, optionsByQuestion.get(q.id) ?? [])),
    }));

  return {
    levels: [...rows.levels]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({ id: asCefrLevel(l.id), name: l.name, nameVi: l.name_vi, description: l.description, order: l.sort_order })),
    modules: rows.modules
      .filter((m) => m.is_published)
      .map((m) => ({
        id: m.id,
        levelId: asCefrLevel(m.level_id),
        title: m.title,
        titleVi: m.title_vi,
        description: m.description,
        order: m.sort_order,
        category: asLessonCategory(m.category),
      }))
      .sort((a, b) => levelIdx(a.levelId) - levelIdx(b.levelId) || a.order - b.order),
    lessons,
    vocabulary: rows.vocabulary
      .filter((v) => v.is_published)
      .map((v) => ({
        id: v.id,
        word: v.word,
        ipa: v.ipa,
        partOfSpeech: asPartOfSpeech(v.part_of_speech),
        level: asCefrLevel(v.level_id),
        topic: v.topic_id,
        definition: v.definition,
        meaningVi: v.meaning_vi,
        example: v.example,
        exampleVi: v.example_vi,
        synonyms: v.synonyms,
        antonyms: v.antonyms,
        collocations: v.collocations,
      }))
      .sort((a, b) => levelIdx(a.level) - levelIdx(b.level) || a.word.localeCompare(b.word)),
    vocabularyTopics: rows.vocabularyTopics.map((t) => ({ id: t.id, name: t.name, nameVi: t.name_vi })),
    exercises,
    grammarTopics: rows.grammarTopics
      .filter((g) => g.lesson_id !== null)
      .map((g) => ({
        id: g.id,
        level: asCefrLevel(g.level_id),
        title: g.title,
        titleVi: g.title_vi,
        summaryVi: g.summary_vi,
        lessonId: g.lesson_id!,
        order: g.sort_order,
      }))
      .sort((a, b) => levelIdx(a.level) - levelIdx(b.level) || a.order - b.order),
  };
}
