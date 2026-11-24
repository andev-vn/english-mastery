import { ASSESSMENT_SKILLS, CEFR_LEVELS, type AssessmentQuestion, type AssessmentSkill, type CefrLevel } from '@/types/content';

/** A level counts as mastered when at least this share of its questions is correct (3 of 4). */
export const LEVEL_PASS_RATIO = 0.75;
export const STRENGTH_RATIO = 0.75;
export const WEAKNESS_RATIO = 0.5;

export interface Tally {
  correct: number;
  total: number;
}

export interface PlacementScore {
  correct: number;
  total: number;
  /** Overall percentage, 0–100. */
  score: number;
  levelScores: Record<CefrLevel, Tally>;
  skillScores: Record<AssessmentSkill, Tally>;
  /** Highest level passed with every level below it also passed; null if A1 was not passed. */
  masteredLevel: CefrLevel | null;
  /** The level to study next: the one after the mastered level (A1 if none, C2 if all). */
  estimatedLevel: CefrLevel;
  strengths: AssessmentSkill[];
  weaknesses: AssessmentSkill[];
}

const ratio = (t: Tally) => (t.total === 0 ? 0 : t.correct / t.total);

/**
 * Scores a placement test. Mirrors `public.score_placement()` on the server
 * (parity is covered by supabase/tests/progress-rpc.test.ts).
 */
export function scorePlacement(questions: AssessmentQuestion[], results: { questionId: string; correct: boolean }[]): PlacementScore {
  const correctById = new Map(results.map((r) => [r.questionId, r.correct]));
  const levelScores = Object.fromEntries(CEFR_LEVELS.map((l) => [l, { correct: 0, total: 0 }])) as Record<CefrLevel, Tally>;
  const skillScores = Object.fromEntries(ASSESSMENT_SKILLS.map((s) => [s, { correct: 0, total: 0 }])) as Record<AssessmentSkill, Tally>;

  let correct = 0;
  for (const q of questions) {
    const ok = correctById.get(q.id) === true;
    levelScores[q.level].total += 1;
    skillScores[q.skill].total += 1;
    if (ok) {
      correct += 1;
      levelScores[q.level].correct += 1;
      skillScores[q.skill].correct += 1;
    }
  }

  let masteredIndex = -1;
  for (const [i, level] of CEFR_LEVELS.entries()) {
    const tally = levelScores[level];
    if (tally.total === 0 || ratio(tally) < LEVEL_PASS_RATIO) break;
    masteredIndex = i;
  }

  const measured = ASSESSMENT_SKILLS.filter((s) => skillScores[s].total > 0);
  return {
    correct,
    total: questions.length,
    score: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
    levelScores,
    skillScores,
    masteredLevel: masteredIndex >= 0 ? CEFR_LEVELS[masteredIndex]! : null,
    estimatedLevel: CEFR_LEVELS[Math.min(masteredIndex + 1, CEFR_LEVELS.length - 1)]!,
    strengths: measured.filter((s) => ratio(skillScores[s]) >= STRENGTH_RATIO),
    weaknesses: measured.filter((s) => ratio(skillScores[s]) < WEAKNESS_RATIO),
  };
}

export const skillLabelVi: Record<AssessmentSkill, string> = {
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
  writing: 'Viết câu',
};
