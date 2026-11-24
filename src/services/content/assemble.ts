import { ACTIVITY_CATEGORIES, ASSESSMENT_SKILLS, CEFR_LEVELS, SKILLS } from '@/types/content';
import type { ActivityCategory, Assessment, AssessmentSkill, ContentBlock, Exercise, Lesson, Question, Skill, SkillActivity } from '@/types/content';
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
  assessments: Tables<'assessments'>[];
  assessmentQuestions: Tables<'assessment_questions'>[];
  activities: Tables<'skill_activities'>[];
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

interface QuestionSource {
  /** Full row id, used in error messages. */
  rowId: string;
  /** Question key inside its exercise or assessment. */
  id: string;
  type: string;
  prompt: string;
  context: string | null;
  explanationVi: string;
  payload: Json;
  /** Exercise options come from answer_options; assessment options live in the payload. */
  options?: Tables<'answer_options'>[];
}

function toQuestion(src: QuestionSource): Question {
  const payload = asObject(src.payload, `payload of ${src.rowId}`);
  const context = src.context ?? (typeof payload.context === 'string' ? payload.context : null);
  const base = {
    id: src.id,
    prompt: src.prompt,
    explanationVi: src.explanationVi,
    ...(context ? { context } : {}),
    ...(typeof payload.audioText === 'string' ? { audioText: payload.audioText } : {}),
  };
  const row = { id: src.rowId };
  const type = asQuestionType(src.type);
  switch (type) {
    case 'multiple_choice': {
      if (!src.options) {
        const opts = payload.options;
        if (!Array.isArray(opts)) throw new TypeError(`Expected options for ${row.id}`);
        return {
          ...base,
          type,
          options: opts.map((o) => {
            const opt = asObject(o, 'option');
            return { id: str(opt, 'id'), text: str(opt, 'text') };
          }),
          correctOptionId: str(payload, 'correctOptionId'),
        };
      }
      const sorted = [...src.options].sort((a, b) => a.position - b.position);
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
        .map((q) =>
          toQuestion({
            rowId: q.id,
            id: q.id.slice(q.exercise_id.length + 1), // '<exercise_id>:<key>' → '<key>'
            type: q.type,
            prompt: q.prompt,
            context: q.context,
            explanationVi: q.explanation_vi,
            payload: q.payload,
            options: optionsByQuestion.get(q.id) ?? [],
          }),
        ),
    }));

  const asSkill = (value: string): AssessmentSkill => {
    if ((ASSESSMENT_SKILLS as readonly string[]).includes(value)) return value as AssessmentSkill;
    throw new TypeError(`Unexpected assessment skill: ${value}`);
  };
  const questionsByAssessment = groupBy(rows.assessmentQuestions, (q) => q.assessment_id);
  const assessments: Assessment[] = rows.assessments
    .filter((a) => a.is_published)
    .map((a) => ({
      id: a.id,
      title: a.title,
      titleVi: a.title_vi,
      description: a.description,
      estimatedMinutes: a.estimated_minutes,
      questions: [...(questionsByAssessment.get(a.id) ?? [])]
        .sort((x, y) => x.position - y.position)
        .map((q) => ({
          ...toQuestion({
            rowId: q.id,
            id: q.id.slice(q.assessment_id.length + 1),
            type: q.type,
            prompt: q.prompt,
            context: null,
            explanationVi: q.explanation_vi,
            payload: q.payload,
          }),
          level: asCefrLevel(q.level_id),
          skill: asSkill(q.skill),
        })),
    }));

  const oneOf = <T extends string>(allowed: readonly T[], value: string, what: string): T => {
    if ((allowed as readonly string[]).includes(value)) return value as T;
    throw new TypeError(`Unexpected ${what}: ${value}`);
  };
  const activities: SkillActivity[] = rows.activities
    .filter((a) => a.is_published)
    .map((a) => {
      const skill = oneOf<Skill>(SKILLS, a.skill, 'skill');
      const payload = asObject(a.payload, `payload of ${a.id}`);
      const base = {
        id: a.id,
        skill,
        level: asCefrLevel(a.level_id),
        category: oneOf<ActivityCategory>(ACTIVITY_CATEGORIES, a.category, 'activity category'),
        title: a.title,
        titleVi: a.title_vi,
        description: a.description,
        order: a.sort_order,
      };
      // Listening/reading link their comprehension exercise through a real foreign key.
      const exercise = skill === 'listening' || skill === 'reading' ? { exerciseId: a.exercise_id ?? '' } : {};
      // The seed generator writes exactly the type-specific fields; the DB check guarantees an object.
      return { ...payload, ...base, ...exercise } as unknown as SkillActivity;
    })
    .sort((x, y) => SKILLS.indexOf(x.skill) - SKILLS.indexOf(y.skill) || levelIdx(x.level) - levelIdx(y.level) || x.order - y.order);

  return {
    activities,
    assessments,
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
