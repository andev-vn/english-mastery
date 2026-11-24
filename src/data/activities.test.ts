import { describe, expect, it } from 'vitest';
import { analyzeWriting } from '@/lib/writingFeedback';
import { matchSpeaking } from '@/lib/speakingMatch';
import { checkDictation } from '@/lib/dictation';
import { activities } from './activities';
import { exercises } from './exercises';
import { vocabulary } from './vocabulary';

const exerciseIds = new Set(exercises.map((e) => e.id));
const wordIds = new Set(vocabulary.map((v) => v.id));

describe('skill activities', () => {
  it('have unique ids and cover all four skills', () => {
    expect(new Set(activities.map((a) => a.id)).size).toBe(activities.length);
    expect(new Set(activities.map((a) => a.skill))).toEqual(new Set(['listening', 'speaking', 'reading', 'writing']));
  });

  it('include Developer English activities in every skill', () => {
    for (const skill of ['listening', 'speaking', 'reading', 'writing'] as const) {
      expect(activities.some((a) => a.skill === skill && (a.category === 'developer' || a.category === 'interview')), skill).toBe(true);
    }
  });

  it('reference existing exercises and words', () => {
    for (const a of activities) {
      if (a.skill === 'listening' || a.skill === 'reading') {
        expect(exerciseIds.has(a.exerciseId), `${a.id} → ${a.exerciseId}`).toBe(true);
        for (const id of a.vocabularyIds) expect(wordIds.has(id), `${a.id} → ${id}`).toBe(true);
      }
    }
  });

  it('listening dictation sentences come from the script', () => {
    for (const a of activities) {
      if (a.skill !== 'listening') continue;
      const script = a.lines.map((l) => l.en).join(' ');
      for (const sentence of a.dictation) {
        expect(script, `${a.id}: ${sentence}`).toContain(sentence.replace(/[.?!]$/, ''));
        expect(checkDictation(sentence, sentence).perfect).toBe(true);
      }
    }
  });

  it('highlighted words actually appear in the text', () => {
    for (const a of activities) {
      if (a.skill !== 'listening' && a.skill !== 'reading') continue;
      const text = (a.skill === 'listening' ? a.lines.map((l) => l.en) : a.paragraphs.map((p) => p.en)).join(' ').toLowerCase();
      for (const id of a.vocabularyIds) {
        const word = vocabulary.find((v) => v.id === id)!.word.toLowerCase();
        expect(text, `${a.id} should contain "${word}"`).toContain(word);
      }
    }
  });

  it('speaking suggested answers fully cover themselves', () => {
    for (const a of activities) {
      if (a.skill !== 'speaking') continue;
      for (const t of a.turns) expect(matchSpeaking(t.suggested, t.suggested).coverage, t.suggested).toBe(100);
    }
  });

  it('writing sample answers pass their own checklist with no rule-based errors', () => {
    for (const a of activities) {
      if (a.skill !== 'writing') continue;
      const f = analyzeWriting(a.sampleAnswer, { minWords: a.minWords, maxWords: a.maxWords, checklist: a.checklist, writingType: a.writingType });
      expect(f.checklist.filter((c) => !c.passed), a.id).toEqual([]);
      expect(f.issues.filter((i) => i.severity !== 'tip'), a.id).toEqual([]);
    }
  });
});
