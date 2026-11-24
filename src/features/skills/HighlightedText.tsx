import { Fragment, useMemo } from 'react';
import type { VocabularyEntry } from '@/types/content';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface HighlightedTextProps {
  text: string;
  words: VocabularyEntry[];
  onWord: (id: string) => void;
}

/**
 * Renders text with lesson vocabulary highlighted as buttons (tap to see the meaning).
 * Matches whole words, case-insensitively, including simple inflections (blockers, reviewed).
 */
export function HighlightedText({ text, words, onWord }: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (words.length === 0) return [{ text, id: null as string | null }];
    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    const pattern = new RegExp(`\\b(${sorted.map((w) => escape(w.word)).join('|')})(s|es|ed|d|ing)?\\b`, 'gi');
    const byWord = new Map(sorted.map((w) => [w.word.toLowerCase(), w.id]));
    const out: { text: string; id: string | null }[] = [];
    let last = 0;
    for (const m of text.matchAll(pattern)) {
      const index = m.index ?? 0;
      if (index > last) out.push({ text: text.slice(last, index), id: null });
      out.push({ text: m[0], id: byWord.get(m[1]!.toLowerCase()) ?? null });
      last = index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), id: null });
    return out;
  }, [text, words]);

  return (
    <>
      {parts.map((p, i) =>
        p.id ? (
          <button
            key={i}
            type="button"
            onClick={() => onWord(p.id!)}
            className="rounded-md bg-warning-soft px-0.5 font-semibold text-text underline decoration-warning decoration-dotted underline-offset-4"
            aria-label={`${p.text} — xem nghĩa`}
          >
            {p.text}
          </button>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}
