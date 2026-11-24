import type { WritingCheck, WritingType } from '@/types/content';

/**
 * Rule-based writing feedback. It catches mechanical problems and frequent mistakes made by
 * Vietnamese learners; it is NOT a substitute for a teacher's (or an AI's) assessment of meaning,
 * style or advanced grammar, and it may miss errors or occasionally flag correct text.
 */

export type IssueSeverity = 'error' | 'warning' | 'tip';

export interface WritingIssue {
  id: string;
  severity: IssueSeverity;
  messageVi: string;
  /** The text the rule matched, when there is one. */
  excerpt?: string;
  suggestion?: string;
}

export interface WritingFeedback {
  wordCount: number;
  sentenceCount: number;
  issues: WritingIssue[];
  checklist: { labelVi: string; passed: boolean }[];
}

interface PatternRule {
  id: string;
  pattern: RegExp;
  severity: IssueSeverity;
  messageVi: string;
  suggestion?: (match: RegExpExecArray) => string;
}

/** Frequent learner errors. Patterns are deliberately narrow to avoid false alarms. */
const RULES: PatternRule[] = [
  { id: 'am-agree', pattern: /\b(I|we|they|you) (am|are) agree\b/gi, severity: 'error', messageVi: '"Agree" là động từ, không dùng với am/are.', suggestion: (m) => `${m[1]} agree` },
  { id: 'discuss-about', pattern: /\bdiscuss(es|ed|ing)? about\b/gi, severity: 'error', messageVi: '"Discuss" không đi với "about".', suggestion: (m) => `discuss${m[1] ?? ''}` },
  { id: 'very-like', pattern: /\b(very|so) (like|love|enjoy)\b/gi, severity: 'error', messageVi: 'Không dùng "very" trước động từ.', suggestion: (m) => `really ${m[2]}` },
  { id: 'more-er', pattern: /\bmore (better|worse|bigger|smaller|cheaper|faster|easier|harder|older|younger|higher|longer)\b/gi, severity: 'error', messageVi: 'Không dùng "more" cùng tính từ đã có đuôi -er.', suggestion: (m) => m[1]! },
  { id: 'uncountable', pattern: /\b(informations|advices|equipments|feedbacks|furnitures|luggages|homeworks|knowledges)\b/gi, severity: 'error', messageVi: 'Danh từ không đếm được, không thêm -s.', suggestion: (m) => m[1]!.slice(0, -1) },
  { id: 'opinion-think', pattern: /\bin my opinion,? I think\b/gi, severity: 'warning', messageVi: '"In my opinion" và "I think" trùng ý; chỉ cần một.', suggestion: () => 'In my opinion' },
  { id: 'depend-of', pattern: /\bdepends? of\b/gi, severity: 'error', messageVi: '"Depend" đi với "on".', suggestion: (m) => `${m[0].split(' ')[0]} on` },
  { id: 'years-old', pattern: /\b(I|he|she|we|they) (have|has) (\d+|[a-z]+-?[a-z]*) years old\b/gi, severity: 'error', messageVi: 'Nói tuổi dùng "be", không dùng "have".', suggestion: (m) => `${m[1]} ${m[1]!.toLowerCase() === 'i' ? 'am' : /^(he|she)$/i.test(m[1]!) ? 'is' : 'are'} ${m[3]} years old` },
  { id: 'can-to', pattern: /\b(can|could|should|must|will|would|might|may) to\b/gi, severity: 'error', messageVi: 'Sau động từ khuyết thiếu không dùng "to".', suggestion: (m) => m[1]! },
  { id: 'third-person', pattern: /(?<!\b(?:does|did|can|could|will|would|should|may|might|must|doesn't|didn't|to|let|make|help)\s)\b(he|she|it) (have|do|go|like|want|work|need|live|study|know|think)\b/gi, severity: 'warning', messageVi: 'Hiện tại đơn với he/she/it cần thêm -s/-es (has, does, goes…).', suggestion: (m) => `${m[1]} ${({ have: 'has', do: 'does', go: 'goes', study: 'studies' } as Record<string, string>)[m[2]!.toLowerCase()] ?? `${m[2]}s`}` },
  { id: 'double-word', pattern: /\b(\w+) \1\b/gi, severity: 'warning', messageVi: 'Từ bị lặp lại — kiểm tra xem có thừa không.', suggestion: (m) => m[1]! },
  { id: 'a-vowel', pattern: /\ba (?!uni|use|usu|uro|eu|one|once|u\b)([aeiou]\w*)/gi, severity: 'warning', messageVi: 'Trước âm nguyên âm thường dùng "an".', suggestion: (m) => `an ${m[1]}` },
  { id: 'space-before-punct', pattern: / +([,.!?;:])/g, severity: 'tip', messageVi: 'Không để dấu cách trước dấu câu.', suggestion: (m) => m[1]! },
];

const sentencesOf = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function analyzeWriting(
  text: string,
  options: { minWords: number; maxWords: number; checklist?: WritingCheck[]; writingType?: WritingType },
): WritingFeedback {
  const trimmed = text.trim();
  const wordCount = countWords(trimmed);
  const sentences = sentencesOf(trimmed);
  const issues: WritingIssue[] = [];

  if (wordCount < options.minWords) {
    issues.push({ id: 'too-short', severity: 'warning', messageVi: `Bài viết có ${wordCount} từ; nên viết ít nhất ${options.minWords} từ.` });
  } else if (wordCount > options.maxWords) {
    issues.push({ id: 'too-long', severity: 'tip', messageVi: `Bài viết có ${wordCount} từ; đề bài gợi ý tối đa ${options.maxWords} từ — hãy viết ngắn gọn hơn.` });
  }

  for (const s of sentences) {
    const first = s.match(/\p{L}/u)?.[0];
    if (first && first !== first.toUpperCase()) {
      issues.push({ id: 'capital', severity: 'error', messageVi: 'Câu cần bắt đầu bằng chữ in hoa.', excerpt: s.slice(0, 40) });
    }
  }
  if (/(^|[^\p{L}'])i(?=[\s,.!?']|$)/u.test(trimmed)) {
    issues.push({ id: 'lowercase-i', severity: 'error', messageVi: 'Đại từ "I" luôn viết hoa.', excerpt: 'i', suggestion: 'I' });
  }
  // Emails legitimately end with a signature (a name), so they are exempt.
  if (trimmed && options.writingType !== 'email' && !/[.!?)"”]$/.test(trimmed)) {
    issues.push({ id: 'end-punctuation', severity: 'warning', messageVi: 'Câu cuối chưa có dấu kết câu (. ! ?).' });
  }

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((match = rule.pattern.exec(trimmed)) !== null) {
      const excerpt = match[0];
      if (seen.has(excerpt.toLowerCase())) continue;
      seen.add(excerpt.toLowerCase());
      issues.push({ id: rule.id, severity: rule.severity, messageVi: rule.messageVi, excerpt, suggestion: rule.suggestion?.(match) });
    }
  }

  if (options.writingType === 'email') {
    if (!/^(hi|hello|dear|good (morning|afternoon))\b/i.test(trimmed)) {
      issues.push({ id: 'email-greeting', severity: 'tip', messageVi: 'Email nên mở đầu bằng lời chào, ví dụ "Hi Anna," hoặc "Dear Mr Smith,".' });
    }
    if (!/(regards|best|thanks|thank you|sincerely|cheers)[\s\S]{0,60}$/i.test(trimmed)) {
      issues.push({ id: 'email-closing', severity: 'tip', messageVi: 'Email nên kết thúc bằng lời chào cuối, ví dụ "Best regards," kèm tên bạn.' });
    }
  }

  const lower = trimmed.toLowerCase();
  const checklist = (options.checklist ?? []).map((c) => ({
    labelVi: c.labelVi,
    passed: c.anyOf.some((needle) => lower.includes(needle.toLowerCase())),
  }));

  return { wordCount, sentenceCount: sentences.length, issues, checklist };
}
