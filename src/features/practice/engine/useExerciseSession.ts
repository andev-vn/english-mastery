import { useCallback, useEffect, useReducer, useRef } from 'react';
import { secondsSince } from '@/lib/date';
import { gradeAnswer } from '@/lib/grading';
import type { AnswerResult, AnswerValue, Exercise } from '@/types/content';

type Phase = 'answering' | 'feedback' | 'finished';

interface SessionState {
  index: number;
  phase: Phase;
  draft: AnswerValue | null;
  results: AnswerResult[];
}

type Action =
  | { type: 'draft'; value: AnswerValue | null }
  | { type: 'check'; result: AnswerResult }
  | { type: 'next'; total: number }
  | { type: 'restart' };

const initial: SessionState = { index: 0, phase: 'answering', draft: null, results: [] };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'draft':
      return state.phase === 'answering' ? { ...state, draft: action.value } : state;
    case 'check':
      return state.phase === 'answering' ? { ...state, phase: 'feedback', results: [...state.results, action.result] } : state;
    case 'next':
      if (state.phase !== 'feedback') return state;
      return state.index + 1 >= action.total
        ? { ...state, phase: 'finished', draft: null }
        : { ...state, index: state.index + 1, phase: 'answering', draft: null };
    case 'restart':
      return initial;
  }
}

/** Drives a one-question-at-a-time exercise: draft → check → feedback → next → finished. */
export function useExerciseSession(exercise: Exercise | null | undefined) {
  const [state, dispatch] = useReducer(reducer, initial);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const total = exercise?.questions.length ?? 0;
  const question = exercise?.questions[state.index];
  const lastResult = state.phase === 'feedback' ? state.results[state.results.length - 1] : undefined;

  const setDraft = useCallback((value: AnswerValue | null) => dispatch({ type: 'draft', value }), []);

  const check = useCallback(() => {
    if (!question || !state.draft) return;
    dispatch({ type: 'check', result: { questionId: question.id, answer: state.draft, correct: gradeAnswer(question, state.draft) } });
  }, [question, state.draft]);

  const next = useCallback(() => dispatch({ type: 'next', total }), [total]);

  const restart = useCallback(() => {
    startedAt.current = Date.now();
    dispatch({ type: 'restart' });
  }, []);

  return {
    ...state,
    total,
    question,
    lastResult,
    correctCount: state.results.filter((r) => r.correct).length,
    elapsedSeconds: () => secondsSince(startedAt.current),
    setDraft,
    check,
    next,
    restart,
  };
}
