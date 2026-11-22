import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Exercise } from '@/types/content';
import { FeedbackPanel } from './FeedbackPanel';
import { QuestionView } from './QuestionView';
import { useExerciseSession } from './useExerciseSession';

const exercise: Exercise = {
  id: 'ex-test',
  title: 'Test',
  titleVi: 'Kiểm tra',
  level: 'A1',
  skill: 'grammar',
  description: '',
  estimatedMinutes: 1,
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      prompt: 'They ___ students.',
      options: [
        { id: 'a', text: 'is' },
        { id: 'b', text: 'are' },
      ],
      correctOptionId: 'b',
      explanationVi: 'They đi với are.',
    },
    { id: 'q2', type: 'fill_blank', prompt: 'Điền từ', sentence: 'She ___ a nurse.', acceptedAnswers: ['is'], explanationVi: 'She → is.' },
    { id: 'q3', type: 'ordering', prompt: 'Sắp xếp', tokens: ['I', 'am', 'ready'], explanationVi: 'S + am + adj.' },
    { id: 'q4', type: 'matching', prompt: 'Nối', pairs: [{ left: 'cat', right: 'mèo' }, { left: 'dog', right: 'chó' }], explanationVi: 'cat = mèo' },
  ],
};

function Harness() {
  const s = useExerciseSession(exercise);
  const [done, setDone] = useState(false);
  if (s.phase === 'finished' || done) return <p>Score {s.correctCount}/{s.total}</p>;
  const q = s.question!;
  return (
    <div>
      <QuestionView key={q.id} question={q} value={s.draft} onChange={s.setDraft} onSubmit={s.check} revealed={s.phase === 'feedback'} correct={s.lastResult?.correct} />
      {s.phase === 'feedback' && s.lastResult ? (
        <FeedbackPanel
          question={q}
          correct={s.lastResult.correct}
          isLast={s.index + 1 === s.total}
          onNext={() => {
            if (s.index + 1 === s.total) setDone(true);
            s.next();
          }}
        />
      ) : (
        <button type="button" disabled={!s.draft} onClick={s.check}>
          Kiểm tra
        </button>
      )}
    </div>
  );
}

describe('exercise engine', () => {
  it('runs through all question types, grading and explaining each answer', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Q1: wrong answer shows the correct one + explanation.
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /is/ }));
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(screen.getByText('They đi với are.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Q2: free text, submitted with Enter.
    await user.type(screen.getByLabelText('Từ cần điền'), 'Is{Enter}');
    expect(screen.getByText('Chính xác!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Q3: ordering by tapping tokens.
    for (const word of ['I', 'am', 'ready']) await user.click(screen.getByRole('button', { name: word }));
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    expect(screen.getByText('Chính xác!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Q4: matching; check stays disabled until every item is paired.
    await user.click(screen.getByRole('button', { name: 'cat' }));
    await user.click(screen.getByRole('button', { name: 'mèo' }));
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'dog' }));
    await user.click(screen.getByRole('button', { name: 'chó' }));
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    expect(screen.getByText('Chính xác!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }));

    expect(screen.getByText('Score 3/4')).toBeInTheDocument();
  });
});
