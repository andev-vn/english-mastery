import { useRef, useState } from 'react';
import { BookOpenText, ClipboardCheck, Headphones, Languages, PenLine, SearchX, SpellCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { QuestionView } from '@/features/practice/engine/QuestionView';
import { uid } from '@/lib/cn';
import { secondsSince } from '@/lib/date';
import { gradeAnswer } from '@/lib/grading';
import { scorePlacement, skillLabelVi, type PlacementScore } from '@/lib/placement';
import { useAssessment } from '@/services/contentQueries';
import { submitAssessment } from '@/services/progressSync';
import { useProgressStore } from '@/stores/progressStore';
import type { AnswerValue } from '@/types/content';
import { PlacementResult } from './PlacementResult';

export const PLACEMENT_TEST_ID = 'placement-v1';

const skillIcons = { vocabulary: Languages, grammar: SpellCheck, reading: BookOpenText, listening: Headphones, writing: PenLine };

export default function PlacementTestPage() {
  const navigate = useNavigate();
  const query = useAssessment(PLACEMENT_TEST_ID);
  const recordAssessment = useProgressStore((s) => s.recordAssessment);
  const [phase, setPhase] = useState<'intro' | 'running' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<AnswerValue | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>({});
  const [result, setResult] = useState<PlacementScore | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const startedAt = useRef(0);

  if (query.isPending) return <PageSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const test = query.data;
  if (!test || test.questions.length === 0) {
    return <EmptyState icon={<SearchX className="size-7" />} title="Bài kiểm tra chưa sẵn sàng" action={<ButtonLink to="/dashboard">Về trang chủ</ButtonLink>} />;
  }

  const start = () => {
    startedAt.current = Date.now();
    setIndex(0);
    setDraft(null);
    setAnswers({});
    setResult(null);
    setPhase('running');
  };

  const finish = (all: Record<string, AnswerValue | null>) => {
    const results = test.questions.map((q) => {
      const a = all[q.id];
      return { questionId: q.id, correct: a ? gradeAnswer(q, a) : false };
    });
    const score = scorePlacement(test.questions, results);
    const durationSeconds = secondsSince(startedAt.current);
    const record = {
      id: uid(),
      assessmentId: test.id,
      estimatedLevel: score.estimatedLevel,
      masteredLevel: score.masteredLevel,
      score: score.score,
      skillScores: Object.fromEntries(
        Object.entries(score.skillScores)
          .filter(([, t]) => t.total > 0)
          .map(([skill, t]) => [skill, Math.round((t.correct / t.total) * 100)]),
      ),
      completedAt: new Date().toISOString(),
    };
    recordAssessment(record);
    // Signed-in users: the server re-grades and stores the result (same rules; idempotent on the record id).
    const answered = Object.fromEntries(Object.entries(all).filter((e): e is [string, AnswerValue] => e[1] !== null));
    void submitAssessment({ assessmentId: test.id, answers: answered, durationSeconds, opId: record.id });
    setResult(score);
    setPhase('result');
  };

  const next = (value: AnswerValue | null) => {
    const question = test.questions[index]!;
    const all = { ...answers, [question.id]: value };
    setAnswers(all);
    setDraft(null);
    if (index + 1 >= test.questions.length) finish(all);
    else setIndex(index + 1);
  };

  if (phase === 'result' && result) return <PlacementResult score={result} onRetake={start} />;

  if (phase === 'intro') {
    const skills = [...new Set(test.questions.map((q) => q.skill))];
    return (
      <div className="flex flex-1 flex-col animate-fade-up">
        <PageHeader title={test.titleVi} subtitle={`${test.questions.length} câu · khoảng ${test.estimatedMinutes} phút`} backTo="/assessments" />
        <p className="text-[15px] text-text-subtle">{test.description}</p>
        <ul className="mt-5 grid grid-cols-2 gap-2.5">
          {skills.map((skill) => {
            const Icon = skillIcons[skill];
            return (
              <li key={skill}>
                <Card padding="sm" className="flex items-center gap-2.5">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm font-semibold">{skillLabelVi[skill]}</span>
                </Card>
              </li>
            );
          })}
        </ul>
        <ul className="mt-5 flex flex-col gap-2 text-sm text-text-subtle">
          <li>• Câu hỏi đi từ dễ (A1) đến khó (C2). Gặp câu quá khó, hãy chọn “Tôi không biết” thay vì đoán.</li>
          <li>• Không có giải thích trong lúc làm bài, để kết quả phản ánh đúng trình độ.</li>
          <li>• Phần nghe dùng giọng đọc của trình duyệt; bạn có thể xem lời thoại nếu không nghe được.</li>
          <li>• Kết quả là ước lượng, không phải chứng chỉ CEFR. Kỹ năng nói chưa được đánh giá.</li>
        </ul>
        <div className="mt-auto pt-8 pb-2">
          <Button size="lg" fullWidth leftIcon={<ClipboardCheck className="size-5" />} onClick={start}>
            Bắt đầu
          </Button>
        </div>
      </div>
    );
  }

  const question = test.questions[index]!;
  const SkillIcon = skillIcons[question.skill];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 pb-5">
        <IconButton label="Thoát bài kiểm tra" icon={<X className="size-5" />} className="-ml-2.5" onClick={() => setConfirmExit(true)} />
        <ProgressBar value={(index / test.questions.length) * 100} label="Tiến độ bài kiểm tra" />
        <span className="shrink-0 text-sm font-semibold text-text-muted tabular-nums">
          {index + 1}/{test.questions.length}
        </span>
      </header>

      <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
        <SkillIcon className="size-4" aria-hidden /> {skillLabelVi[question.skill]}
      </p>
      <div className="flex-1 animate-fade-up" key={question.id}>
        <QuestionView question={question} value={draft} onChange={setDraft} onSubmit={() => draft && next(draft)} revealed={false} />
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-2.5 bg-bg pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" size="lg" onClick={() => next(null)}>
          Tôi không biết
        </Button>
        <Button size="lg" fullWidth disabled={!draft} onClick={() => draft && next(draft)}>
          {index + 1 >= test.questions.length ? 'Xem kết quả' : 'Tiếp tục'}
        </Button>
      </div>

      <Modal
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="Thoát bài kiểm tra?"
        description="Câu trả lời của lần làm này sẽ không được lưu."
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setConfirmExit(false)}>
              Ở lại
            </Button>
            <Button variant="danger" fullWidth onClick={() => navigate('/assessments', { replace: true })}>
              Thoát
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Bạn đã trả lời {index}/{test.questions.length} câu.
        </p>
      </Modal>
    </div>
  );
}
