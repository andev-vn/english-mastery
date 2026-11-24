import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import {
  AIRefusalError,
  answerEvaluationSchema,
  writingFeedbackSchema,
  type AIAnswerEvaluation,
  type AIProvider,
  type AIWritingFeedback,
  type ChatTurn,
  type Result,
  type TutorContext,
  type Usage,
} from './provider.ts';

/**
 * Claude adapter. Model and key come from the function's server-side secrets (ANTHROPIC_API_KEY,
 * optional AI_MODEL). On a safety decline the API retries on a fallback model ("default" routing);
 * if the whole chain declines we raise AIRefusalError.
 */

export const DEFAULT_MODEL = 'claude-opus-5-5';
const BETAS = ['server-side-fallback-2026-07-01'];

const tutorSystem = ({ level }: TutorContext) =>
  [
    'You are a friendly English tutor inside "English Mastery", an app for Vietnamese learners.',
    `The learner's level is CEFR ${level}. Write English they can follow at that level: short sentences, common words${level === 'A1' || level === 'A2' ? ', and add a short Vietnamese translation in brackets after difficult sentences' : ''}.`,
    'Keep every reply short (under 120 words) and end with a question or a small task that keeps them practising.',
    'When the learner makes a mistake, show the corrected sentence first, then explain it briefly in Vietnamese.',
    'Stay on learning English (conversation practice, grammar, vocabulary, pronunciation tips, work and developer English).',
    'If asked about something else, answer in one sentence and steer back to practising English.',
  ].join('\n');

const reviewerSystem = ({ level }: TutorContext) =>
  [
    'You review English written by a Vietnamese learner.',
    `The learner's level is CEFR ${level}: judge against that level and do not rewrite their text into advanced English.`,
    'Explanations are in Vietnamese, concise and encouraging.',
  ].join('\n');

function usageOf(message: { model: string; usage: { input_tokens: number; output_tokens: number } }): Usage {
  return { model: message.model, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens };
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  }

  async generateResponse(input: TutorContext & { messages: ChatTurn[] }): Promise<Result<string>> {
    const message = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: 4000,
      betas: BETAS,
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: tutorSystem(input),
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    if (message.stop_reason === 'refusal') throw new AIRefusalError();
    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!text) throw new Error('Empty AI reply');
    return { value: text, usage: usageOf(message) };
  }

  async correctWriting(input: TutorContext & { text: string; taskVi?: string }): Promise<Result<AIWritingFeedback>> {
    const message = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 8000,
      betas: BETAS,
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(writingFeedbackSchema) },
      system: reviewerSystem(input),
      messages: [
        {
          role: 'user',
          content: `${input.taskVi ? `Writing task (Vietnamese): ${input.taskVi}\n\n` : ''}Learner text:\n<text>\n${input.text}\n</text>`,
        },
      ],
    });
    if (message.stop_reason === 'refusal') throw new AIRefusalError();
    if (!message.parsed_output) throw new Error('AI feedback could not be parsed');
    return { value: message.parsed_output, usage: usageOf(message) };
  }

  async evaluateAnswer(input: TutorContext & { question: string; answer: string }): Promise<Result<AIAnswerEvaluation>> {
    const message = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 4000,
      betas: BETAS,
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(answerEvaluationSchema) },
      system: reviewerSystem(input),
      messages: [
        {
          role: 'user',
          content: `Speaking practice question: ${input.question}\n\nThe learner answered (it may be a speech-recognition transcript, so ignore missing punctuation):\n<answer>\n${input.answer}\n</answer>`,
        },
      ],
    });
    if (message.stop_reason === 'refusal') throw new AIRefusalError();
    if (!message.parsed_output) throw new Error('AI evaluation could not be parsed');
    return { value: message.parsed_output, usage: usageOf(message) };
  }
}
