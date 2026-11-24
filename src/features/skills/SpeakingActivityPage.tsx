import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Keyboard, Lightbulb, Mic, MicOff, RotateCcw, Volume2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { isSpeechSynthesisSupported, speak, stopSpeaking } from '@/lib/speech';
import { AIAnswerReview } from '@/features/tutor/AIReview';
import { matchSpeaking, type SpeakingMatch } from '@/lib/speakingMatch';
import { recognitionErrorMessage, useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { useProgressStore } from '@/stores/progressStore';
import { ActivityHeader } from './ActivityHeader';
import { useActivityPage } from './useActivityPage';

const RATES = [0.75, 1] as const;

export default function SpeakingActivityPage() {
  const { activity, isPending, isError, refetch, progress } = useActivityPage('speaking');
  const completeActivity = useProgressStore((s) => s.completeActivity);
  const recognition = useSpeechRecognition('en-US');
  const ttsSupported = isSpeechSynthesisSupported();
  const [turn, setTurn] = useState(0);
  const [typing, setTyping] = useState(!recognition.supported);
  const [typed, setTyped] = useState('');
  const [typedResult, setTypedResult] = useState<SpeakingMatch | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [rate, setRate] = useState<number>(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  // A final spoken transcript is checked automatically; typed answers are checked on demand.
  const spoken = recognition.transcript;
  const current = activity?.turns[turn];
  const spokenResult = useMemo(() => (spoken && current ? matchSpeaking(spoken, current.suggested) : null), [spoken, current]);
  const result = typing ? typedResult : spokenResult;

  if (isPending) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!activity || !current) return <EmptyState icon={<Mic className="size-7" />} title="Không tìm thấy bài nói" action={<ButtonLink to="/speaking">Về Luyện nói</ButtonLink>} />;

  const answer = typing ? typed : spoken;
  const isLast = turn + 1 >= activity.turns.length;

  const next = () => {
    const all = result ? [...scores, result.coverage] : scores;
    setScores(all);
    setTypedResult(null);
    setTyped('');
    recognition.reset();
    if (isLast) {
      const average = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
      completeActivity({ id: activity.id, title: `Nói: ${activity.titleVi}`, minutes: 5, score: average });
      setFinished(true);
    } else {
      setTurn(turn + 1);
    }
  };

  const restart = () => {
    setTurn(0);
    setScores([]);
    setTypedResult(null);
    setTyped('');
    setFinished(false);
    recognition.reset();
  };

  if (finished) {
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="flex flex-col gap-5 animate-fade-up">
        <ActivityHeader activity={activity} done />
        <Card className="text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
          <h2 className="mt-2 text-xl font-bold">Hoàn thành hội thoại!</h2>
          <p className="mt-1 text-sm text-text-muted">Bạn đã luyện {activity.turns.length} lượt nói.</p>
          <p className="mt-3 text-sm">
            Mức khớp nội dung trung bình với câu gợi ý: <strong>{average}%</strong>
          </p>
        </Card>
        <div className="flex flex-col gap-2.5">
          <Button size="lg" leftIcon={<RotateCcw className="size-4" />} onClick={restart}>
            Luyện lại
          </Button>
          <ButtonLink to="/speaking" variant="outline" size="lg" replace>
            Chọn bài nói khác
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-5 animate-fade-up pb-4">
      <div>
        <ActivityHeader activity={activity} done={Boolean(progress)} />
        <Card padding="sm" className="bg-surface-muted">
          <p className="text-sm text-text-subtle">{activity.scenarioVi}</p>
          <p className="mt-1 text-xs text-text-muted">Người đối thoại: {activity.partnerRole}</p>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar value={(turn / activity.turns.length) * 100} label="Tiến độ hội thoại" />
        <span className="shrink-0 text-sm font-semibold text-text-muted tabular-nums">
          {turn + 1}/{activity.turns.length}
        </span>
      </div>

      {/* Partner line */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 rounded-3xl rounded-tl-md bg-surface p-4 shadow-card">
          <p className="text-[16px] font-semibold">{current.partner}</p>
          <p className="mt-1 text-sm text-text-muted">{current.partnerVi}</p>
        </div>
        {ttsSupported && <IconButton label="Nghe câu hỏi" variant="soft" icon={<Volume2 className="size-5" />} onClick={() => speak(current.partner, rate * 0.95)} />}
      </div>
      {ttsSupported && (
        <div role="radiogroup" aria-label="Tốc độ đọc" className="flex self-start rounded-xl bg-surface-muted p-1">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rate === r}
              onClick={() => setRate(r)}
              className={cn('min-h-9 rounded-lg px-3 text-sm font-semibold', rate === r ? 'bg-surface text-text shadow-card' : 'text-text-muted')}
            >
              {r === 1 ? 'Bình thường' : 'Chậm'}
            </button>
          ))}
        </div>
      )}
      {current.hintVi && (
        <p className="flex items-start gap-2 text-sm text-text-subtle">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /> {current.hintVi}
        </p>
      )}

      {/* Learner answer */}
      <section aria-labelledby="your-answer" className="flex flex-col gap-3">
        <h2 id="your-answer" className="text-sm font-bold">
          Câu trả lời của bạn
        </h2>
        {!typing ? (
          <>
            <Button
              size="lg"
              variant={recognition.listening ? 'danger' : 'primary'}
              leftIcon={recognition.listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              onClick={() => (recognition.listening ? recognition.stop() : recognition.start())}
            >
              {recognition.listening ? 'Dừng ghi âm' : spoken ? 'Nói lại' : 'Nhấn để nói'}
            </Button>
            {(recognition.interim || spoken) && (
              <p className="rounded-2xl border-2 border-dashed border-border px-4 py-3 text-[15px]" aria-live="polite">
                {spoken || <span className="text-text-muted">{recognition.interim}…</span>}
              </p>
            )}
            {recognition.error && (
              <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                {recognitionErrorMessage(recognition.error)}
              </p>
            )}
            <p className="text-xs text-text-muted">
              Giọng nói được trình duyệt nhận dạng (Chrome gửi âm thanh tới dịch vụ nhận dạng của Google). Ứng dụng không lưu bản ghi âm.
            </p>
          </>
        ) : (
          <>
            {!recognition.supported && (
              <p className="text-sm text-text-muted">
                Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy nói thành tiếng rồi gõ lại câu trả lời — vẫn là cách luyện hiệu quả.
              </p>
            )}
            <textarea
              rows={3}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setTypedResult(null);
              }}
              aria-label="Gõ câu trả lời"
              placeholder="Nói thành tiếng, rồi gõ câu trả lời của bạn…"
              className="w-full resize-none rounded-2xl border-2 border-border bg-surface px-4 py-3 text-[16px] focus:border-primary focus:outline-none"
            />
            <Button variant="secondary" disabled={!typed.trim()} onClick={() => setTypedResult(matchSpeaking(typed, current.suggested))}>
              Kiểm tra câu trả lời
            </Button>
          </>
        )}
        {recognition.supported && (
          <button
            type="button"
            onClick={() => {
              setTyping((v) => !v);
              setTypedResult(null);
              recognition.reset();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary"
          >
            {typing ? <Mic className="size-4" aria-hidden /> : <Keyboard className="size-4" aria-hidden />}
            {typing ? 'Trả lời bằng giọng nói' : 'Gõ câu trả lời thay vì nói'}
          </button>
        )}
      </section>

      {result && answer && (
        <section role="status" aria-labelledby="feedback" className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 id="feedback" className="text-sm font-bold">
            Mức khớp nội dung với câu gợi ý: {result.coverage}%
          </h2>
          <ProgressBar value={result.coverage} label="Mức khớp nội dung" tone={result.coverage >= 70 ? 'success' : result.coverage >= 40 ? 'primary' : 'warning'} />
          {result.missing.length > 0 && <p className="text-sm text-text-subtle">Từ khoá bạn có thể thêm: {result.missing.join(', ')}</p>}
          <div className="flex items-start gap-2 rounded-2xl bg-success-soft p-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-success uppercase">Câu gợi ý</p>
              <p className="mt-0.5 text-[15px] font-semibold">{current.suggested}</p>
            </div>
            {ttsSupported && <IconButton label="Nghe câu gợi ý" icon={<Volume2 className="size-5" />} onClick={() => speak(current.suggested, rate * 0.95)} />}
          </div>
          <p className="text-xs text-text-muted">Đây chỉ là so sánh từ khoá, không đánh giá phát âm. Câu trả lời khác câu gợi ý vẫn có thể đúng.</p>
          <AIAnswerReview key={`${turn}:${answer}`} question={current.partner} answer={answer} />
        </section>
      )}

      <Button size="lg" fullWidth rightIcon={<ArrowRight className="size-5" />} disabled={!result} onClick={next}>
        {isLast ? 'Hoàn thành hội thoại' : 'Câu tiếp theo'}
      </Button>

      <section aria-labelledby="phrases">
        <SectionTitle id="phrases" title="Mẫu câu hữu ích" />
        <Card padding="none">
          <ul className="divide-y divide-border">
            {activity.usefulPhrases.map((p) => (
              <li key={p.en} className="flex items-center gap-2 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.en}</span>
                  <span className="block text-sm text-text-muted">{p.vi}</span>
                </span>
                {ttsSupported && <IconButton label={`Nghe: ${p.en}`} icon={<Volume2 className="size-4" />} onClick={() => speak(p.en.replace(/…/g, ''), rate * 0.95)} />}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card padding="sm" className="flex gap-3 bg-warning-soft">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <p className="text-sm">{activity.grammarTipVi}</p>
      </Card>
    </article>
  );
}
