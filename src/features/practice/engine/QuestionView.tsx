import { BookText } from 'lucide-react';
import { ListeningClip } from '@/components/learning/ListeningClip';
import type { AnswerValue, Question } from '@/types/content';
import { MatchingInput, MultipleChoiceInput, OrderingInput, TrueFalseInput } from './inputs';
import { TextAnswerInput } from './TextAnswerInput';

const typeLabel: Record<Question['type'], string> = {
  multiple_choice: 'Chọn đáp án đúng',
  true_false: 'Đúng hay sai',
  fill_blank: 'Điền vào chỗ trống',
  matching: 'Nối cặp',
  ordering: 'Sắp xếp câu',
  error_correction: 'Sửa lỗi sai',
  translation: 'Dịch câu',
};

interface QuestionViewProps {
  question: Question;
  value: AnswerValue | null;
  onChange: (value: AnswerValue | null) => void;
  onSubmit: () => void;
  revealed: boolean;
  correct?: boolean;
}

/** Renders any question type from the typed exercise model. */
export function QuestionView({ question, value, onChange, onSubmit, revealed, correct }: QuestionViewProps) {
  const common = { value, onChange, revealed };

  let input;
  switch (question.type) {
    case 'multiple_choice':
      input = <MultipleChoiceInput question={question} {...common} />;
      break;
    case 'true_false':
      input = <TrueFalseInput question={question} {...common} />;
      break;
    case 'matching':
      input = <MatchingInput question={question} {...common} />;
      break;
    case 'ordering':
      input = <OrderingInput question={question} {...common} />;
      break;
    case 'fill_blank':
    case 'error_correction':
    case 'translation':
      input = <TextAnswerInput question={question} {...common} onSubmit={onSubmit} correct={correct} />;
      break;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Transcript stays visible after answering so the learner can check what they heard. */}
      {question.audioText && <ListeningClip key={question.id} text={question.audioText} hideTranscript={!revealed} />}
      {question.context && (
        <details className="group rounded-card border border-border bg-surface p-4" open>
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-bold text-text-muted">
            <BookText className="size-4" aria-hidden /> Đoạn văn
            <span className="ml-auto text-xs font-medium group-open:hidden">Mở</span>
            <span className="ml-auto hidden text-xs font-medium group-open:inline">Thu gọn</span>
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed">{question.context}</p>
        </details>
      )}
      <div>
        <p className="text-xs font-bold tracking-wide text-primary uppercase">{typeLabel[question.type]}</p>
        <h2 className="mt-1.5 text-lg leading-snug font-bold text-balance">{question.prompt}</h2>
      </div>
      {input}
    </div>
  );
}
