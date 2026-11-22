import type { AnswerValue, Question } from '@/types/content';

/** Normalises free-text answers: case, curly quotes, whitespace and trailing punctuation. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+([?.!,])/g, '$1')
    .replace(/[.!?]+$/g, '')
    .trim();
}

export function matchesAny(input: string, accepted: string[]): boolean {
  const value = normalizeAnswer(input);
  return value.length > 0 && accepted.some((a) => normalizeAnswer(a) === value);
}

export function gradeAnswer(question: Question, answer: AnswerValue): boolean {
  switch (question.type) {
    case 'multiple_choice':
      return answer.type === 'multiple_choice' && answer.optionId === question.correctOptionId;
    case 'true_false':
      return answer.type === 'true_false' && answer.value === question.answer;
    case 'fill_blank':
    case 'error_correction':
    case 'translation':
      return answer.type === question.type && matchesAny(answer.text, question.acceptedAnswers);
    case 'matching':
      return (
        answer.type === 'matching' &&
        question.pairs.length === Object.keys(answer.pairs).length &&
        question.pairs.every((p) => answer.pairs[p.left] === p.right)
      );
    case 'ordering':
      return (
        answer.type === 'ordering' &&
        answer.tokens.length === question.tokens.length &&
        answer.tokens.every((t, i) => t === question.tokens[i])
      );
  }
}

/** Human-readable correct answer for feedback panels. */
export function correctAnswerText(question: Question): string {
  switch (question.type) {
    case 'multiple_choice':
      return question.options.find((o) => o.id === question.correctOptionId)?.text ?? '';
    case 'true_false':
      return question.answer ? 'True — Đúng' : 'False — Sai';
    case 'fill_blank':
      return question.sentence.replace('___', question.acceptedAnswers[0] ?? '');
    case 'error_correction':
    case 'translation':
      return question.acceptedAnswers[0] ?? '';
    case 'matching':
      return question.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    case 'ordering':
      return joinTokens(question.tokens);
  }
}

/** Joins sentence tokens, attaching trailing punctuation to the previous word. */
export function joinTokens(tokens: string[]): string {
  return tokens.join(' ').replace(/\s+([?.!,])/g, '$1');
}

export function scorePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** Deterministic shuffle (mulberry32 seeded by a string) that never returns the original order for 2+ items. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  const rand = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  if (result.length > 1 && result.every((v, i) => v === items[i])) {
    result.push(result.shift()!);
  }
  return result;
}
