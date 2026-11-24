import { describe, expect, it } from 'vitest';
import { checkDictation, normalizeWord } from './dictation';
import { matchSpeaking } from './speakingMatch';
import { analyzeWriting, countWords } from './writingFeedback';

describe('checkDictation', () => {
  it('accepts a perfect answer regardless of case, punctuation and curly quotes', () => {
    const r = checkDictation("I don't have any blockers today.", 'i don’t have ANY blockers today');
    expect(r.perfect).toBe(true);
    expect(r.score).toBe(100);
  });

  it('marks only the missing word when one word is skipped', () => {
    const r = checkDictation('The train leaves at six.', 'The train at six');
    expect(r.words.map((w) => w.correct)).toEqual([true, true, false, true, true]);
    expect(r.score).toBe(80);
    expect(r.perfect).toBe(false);
  });

  it('reports extra and misspelled words', () => {
    const r = checkDictation('We meet on Friday.', 'We will meat on Friday');
    expect(r.extra).toEqual(['will', 'meat']);
    expect(r.words.find((w) => w.text === 'meet')?.correct).toBe(false);
  });

  it('normalizes words', () => {
    expect(normalizeWord('“Hello,”')).toBe('hello');
    expect(normalizeWord('Don’t')).toBe("don't");
  });
});

describe('matchSpeaking', () => {
  it('measures coverage of content words, ignoring function words and inflection', () => {
    const r = matchSpeaking('Yesterday I fixed the login bug', 'Yesterday I fixed a bug in the login page.');
    expect(r.missing).toEqual(['page']);
    expect(r.coverage).toBe(80);
  });

  it('is zero for an unrelated answer', () => {
    expect(matchSpeaking('I like pizza', 'The deployment failed last night.').coverage).toBe(0);
  });
});

describe('analyzeWriting', () => {
  const opts = { minWords: 5, maxWords: 80 };
  const ids = (text: string, o = opts) => analyzeWriting(text, o).issues.map((i) => i.id);

  it('counts words and sentences', () => {
    const f = analyzeWriting('I wake up at six. Then I have breakfast!', opts);
    expect(f.wordCount).toBe(9);
    expect(f.sentenceCount).toBe(2);
    expect(countWords('  — hello   world  ')).toBe(2);
  });

  it('finds frequent learner mistakes with suggestions', () => {
    const f = analyzeWriting('I am agree with you. We discussed about the informations. My code is more faster now.', opts);
    const byId = Object.fromEntries(f.issues.map((i) => [i.id, i]));
    expect(byId['am-agree']?.suggestion).toBe('I agree');
    expect(byId['discuss-about']?.suggestion).toBe('discussed');
    expect(byId['uncountable']?.suggestion).toBe('information');
    expect(byId['more-er']?.suggestion).toBe('faster');
  });

  it('checks capitals, lowercase i and final punctuation', () => {
    expect(ids('today i went to work. it was busy')).toEqual(expect.arrayContaining(['capital', 'lowercase-i', 'end-punctuation']));
  });

  it('flags missing third-person -s but not after auxiliaries', () => {
    expect(ids('Every day she go to the office by bus.')).toContain('third-person');
    expect(ids('Does she have a car? She can go by bus.')).not.toContain('third-person');
  });

  it('does not flag correct text', () => {
    expect(ids('My name is Lan. I work as a developer in an office in Da Nang. I usually walk to work.')).toEqual([]);
    expect(ids('She is a university student and a user of this app.')).not.toContain('a-vowel');
  });

  it('checks length, email conventions and the checklist', () => {
    expect(ids('Too short.', { minWords: 20, maxWords: 80 })).toContain('too-short');
    const email = analyzeWriting('Could you review my pull request today?', {
      minWords: 3,
      maxWords: 80,
      writingType: 'email',
      checklist: [{ labelVi: 'Nhờ giúp đỡ', anyOf: ['could you', 'can you'] }],
    });
    expect(email.issues.map((i) => i.id)).toEqual(expect.arrayContaining(['email-greeting', 'email-closing']));
    expect(email.checklist).toEqual([{ labelVi: 'Nhờ giúp đỡ', passed: true }]);
  });
});
