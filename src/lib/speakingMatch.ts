import { normalizeWord } from './dictation';

/**
 * Compares a spoken (or typed) answer with the suggested answer by content words.
 * This measures how much of the expected content the learner covered — it does NOT assess
 * pronunciation, fluency or whether a different but valid answer is correct.
 */

const STOPWORDS = new Set(
  'a an the and or but so to of in on at for with from by is am are was were be been being i you he she it we they me him her us them my your his its our their this that these those do does did have has had will would can could should not no yes there here what which who when where why how just very really also then than as if about up out'.split(
    ' ',
  ),
);

export interface SpeakingMatch {
  /** Content words of the suggested answer that the learner used, 0–100. */
  coverage: number;
  matched: string[];
  missing: string[];
  wordCount: number;
}

const contentWords = (text: string) =>
  text
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w && !STOPWORDS.has(w));

/** Very small stemmer so "work/works/worked/working" count as the same word. */
const stem = (w: string) => w.replace(/'s$/, '').replace(/(ing|ed|es|s)$/, '') || w;

export function matchSpeaking(answer: string, suggested: string): SpeakingMatch {
  const target = [...new Set(contentWords(suggested))];
  const said = new Set(contentWords(answer).map(stem));
  const matched = target.filter((w) => said.has(stem(w)));
  const missing = target.filter((w) => !said.has(stem(w)));
  return {
    coverage: target.length === 0 ? 0 : Math.round((matched.length / target.length) * 100),
    matched,
    missing,
    wordCount: answer.split(/\s+/).filter(Boolean).length,
  };
}
