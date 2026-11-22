import type { VocabularyEntry } from '@/types/content';

type Entry = Omit<VocabularyEntry, 'synonyms' | 'antonyms' | 'collocations'> &
  Partial<Pick<VocabularyEntry, 'synonyms' | 'antonyms' | 'collocations'>>;

/** Builds a vocabulary entry, defaulting the optional word lists to empty. */
export const e = (entry: Entry): VocabularyEntry => ({
  synonyms: [],
  antonyms: [],
  collocations: [],
  ...entry,
});
