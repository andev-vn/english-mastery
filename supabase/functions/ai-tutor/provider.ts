import { z } from 'zod';

/**
 * Provider-neutral AI interface. The Edge Function only talks to this; swapping provider means
 * writing another adapter (see anthropic.ts). Runs server-side only: provider keys never reach the browser.
 */

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Cefr = (typeof CEFR)[number];

export interface TutorContext {
  /** The learner's CEFR level, so replies use language they can follow. */
  level: Cefr;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const writingFeedbackSchema = z.object({
  correctedText: z.string().describe('The learner text with every mistake fixed, keeping their meaning and style.'),
  issues: z
    .array(
      z.object({
        original: z.string().describe('The exact wrong fragment from the learner text.'),
        suggestion: z.string().describe('The corrected fragment.'),
        explanationVi: z.string().describe('Short explanation in Vietnamese.'),
      }),
    )
    .describe('At most 8 of the most important mistakes, in order of appearance.'),
  overallVi: z.string().describe('2-3 sentences of overall feedback in Vietnamese: one strength, one thing to improve.'),
});
export type AIWritingFeedback = z.infer<typeof writingFeedbackSchema>;

export const answerEvaluationSchema = z.object({
  verdict: z.enum(['good', 'acceptable', 'needs_work']),
  feedbackVi: z.string().describe('2-3 sentences in Vietnamese about meaning, grammar and naturalness.'),
  improvedAnswer: z.string().describe('A natural English answer close to what the learner tried to say.'),
});
export type AIAnswerEvaluation = z.infer<typeof answerEvaluationSchema>;

export interface Usage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface Result<T> {
  value: T;
  usage: Usage;
}

export interface AIProvider {
  readonly name: string;
  generateResponse(input: TutorContext & { messages: ChatTurn[] }): Promise<Result<string>>;
  correctWriting(input: TutorContext & { text: string; taskVi?: string }): Promise<Result<AIWritingFeedback>>;
  evaluateAnswer(input: TutorContext & { question: string; answer: string }): Promise<Result<AIAnswerEvaluation>>;
}

/** The model declined (safety) — shown to the learner as a polite message, not an error page. */
export class AIRefusalError extends Error {
  constructor() {
    super('The AI declined this request');
    this.name = 'AIRefusalError';
  }
}
