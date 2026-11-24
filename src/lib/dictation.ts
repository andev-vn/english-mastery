/** Word-level comparison for dictation practice. */

export interface DictationWord {
  /** The word as written in the original sentence (with its punctuation). */
  text: string;
  correct: boolean;
}

export interface DictationResult {
  words: DictationWord[];
  /** Typed words that are not in the sentence. */
  extra: string[];
  /** Share of the sentence's words typed correctly and in order, 0–100. */
  score: number;
  perfect: boolean;
}

/** Lower-case, straight apostrophes, no surrounding punctuation. "Don’t," → "don't". */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFC')
    .replace(/[‘’ʼ`]/g, "'")
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
}

const split = (s: string) => s.split(/\s+/).filter(Boolean);

/**
 * Aligns the typed words to the sentence with a longest-common-subsequence, so one missing
 * word does not mark everything after it as wrong.
 */
export function checkDictation(sentence: string, typed: string): DictationResult {
  const original = split(sentence);
  const expected = original.map(normalizeWord);
  const actualRaw = split(typed);
  const actual = actualRaw.map(normalizeWord);
  const n = expected.length;
  const m = actual.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] = expected[i] === actual[j] && expected[i] !== '' ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const matchedExpected = new Set<number>();
  const matchedActual = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (expected[i] === actual[j] && expected[i] !== '') {
      matchedExpected.add(i++);
      matchedActual.add(j++);
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      i++;
    } else {
      j++;
    }
  }

  const words = original.map((text, k) => ({ text, correct: matchedExpected.has(k) }));
  const extra = actualRaw.filter((_, k) => !matchedActual.has(k) && actual[k] !== '');
  const correct = words.filter((w) => w.correct).length;
  const score = n === 0 ? 0 : Math.round((correct / n) * 100);
  return { words, extra, score, perfect: correct === n && extra.length === 0 };
}
