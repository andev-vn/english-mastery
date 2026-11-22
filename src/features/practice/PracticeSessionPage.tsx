import { useState } from 'react';
import { SearchX, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { useExercise } from '@/services/contentQueries';
import { recordAnswers } from '@/services/learningSync';
import { useProgressStore } from '@/stores/progressStore';
import { FeedbackPanel } from './engine/FeedbackPanel';
import { QuestionView } from './engine/QuestionView';
import { ResultSummary } from './engine/ResultSummary';
import { useExerciseSession } from './engine/useExerciseSession';

export default function PracticeSessionPage() {
  const { exerciseId = '' } = useParams();
  const [params] = useSearchParams();
  const fromLesson = params.get('lesson');
  const navigate = useNavigate();
  const query = useExercise(exerciseId);
  const exercise = query.data;
  const session = useExerciseSession(exercise);
  const recordExercise = useProgressStore((s) => s.recordExercise);
  const [summary, setSummary] = useState<{ xp: number; duration: number } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const exitTo = fromLesson ? `/lessons/${fromLesson}` : '/practice';

  if (query.isPending) return <PageSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!exercise || exercise.questions.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-7" />}
        title="Không tìm thấy bài luyện tập"
        action={<ButtonLink to="/practice">Về Luyện tập</ButtonLink>}
      />
    );
  }

  const handleNext = () => {
    const isLast = session.index + 1 >= session.total;
    if (isLast) {
      const duration = session.elapsedSeconds();
      const correct = session.correctCount;
      const { xp, attempt } = recordExercise({ exerciseId: exercise.id, title: exercise.titleVi, correct, total: session.total, durationSeconds: duration });
      // Answer history for signed-in users; failures never block the learner (the local attempt is kept).
      recordAnswers({ exerciseId: exercise.id, attemptId: attempt.id, results: session.results }).catch((e: unknown) => {
        if (import.meta.env.DEV) console.warn('[answers] not recorded:', e);
      });
      setSummary({ xp, duration });
    }
    session.next();
  };

  if (session.phase === 'finished' && summary) {
    return (
      <ResultSummary
        exercise={exercise}
        results={session.results}
        xp={summary.xp}
        durationSeconds={summary.duration}
        onRetry={() => {
          setSummary(null);
          session.restart();
        }}
        continueTo={fromLesson ? { to: `/lessons/${fromLesson}`, label: 'Quay lại bài học' } : { to: '/practice', label: 'Tiếp tục luyện tập' }}
      />
    );
  }

  const question = session.question;
  if (!question) return null;
  const revealed = session.phase === 'feedback';
  const answeredCount = session.results.length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 pb-5">
        <IconButton
          label="Thoát bài luyện tập"
          icon={<X className="size-5" />}
          className="-ml-2.5"
          onClick={() => (answeredCount > 0 ? setConfirmExit(true) : navigate(exitTo, { replace: true }))}
        />
        <ProgressBar value={(answeredCount / session.total) * 100} label="Tiến độ bài luyện tập" tone="success" />
        <span className="shrink-0 text-sm font-semibold text-text-muted tabular-nums">
          {session.index + 1}/{session.total}
        </span>
      </header>

      <div className="flex-1 animate-fade-up" key={question.id}>
        <QuestionView
          question={question}
          value={session.draft}
          onChange={session.setDraft}
          onSubmit={session.check}
          revealed={revealed}
          correct={session.lastResult?.correct}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 sm:mx-0">
        {revealed && session.lastResult ? (
          <FeedbackPanel question={question} correct={session.lastResult.correct} isLast={session.index + 1 >= session.total} onNext={handleNext} />
        ) : (
          <div className="bg-bg px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-0">
            <Button size="lg" fullWidth disabled={!session.draft} onClick={session.check}>
              Kiểm tra
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="Thoát bài luyện tập?"
        description="Kết quả của lần làm này sẽ không được lưu."
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setConfirmExit(false)}>
              Ở lại
            </Button>
            <Button variant="danger" fullWidth onClick={() => navigate(exitTo, { replace: true })}>
              Thoát
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-subtle">Bạn đã trả lời {answeredCount}/{session.total} câu.</p>
      </Modal>
    </div>
  );
}
