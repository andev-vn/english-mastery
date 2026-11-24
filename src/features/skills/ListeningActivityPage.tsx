import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Dumbbell, Eye, EyeOff, Languages, Play, Square, Volume2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { WordDetailSheet } from '@/features/vocabulary/WordDetailSheet';
import { cn } from '@/lib/cn';
import { checkDictation, type DictationResult } from '@/lib/dictation';
import { isSpeechSynthesisSupported, speak, speakLines, stopSpeaking } from '@/lib/speech';
import { useProgressStore } from '@/stores/progressStore';
import { ActivityHeader } from './ActivityHeader';
import { HighlightedText } from './HighlightedText';
import { useActivityPage } from './useActivityPage';
import { useWordSheet } from './useWordSheet';

const RATES = [0.75, 1, 1.25] as const;

function DictationItem({ sentence, index, rate, onChecked }: { sentence: string; index: number; rate: number; onChecked: (score: number) => void }) {
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<DictationResult | null>(null);
  const check = () => {
    const r = checkDictation(sentence, typed);
    setResult(r);
    onChecked(r.score);
  };
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconButton label={`Nghe câu ${index + 1}`} variant="soft" icon={<Volume2 className="size-5" />} onClick={() => speak(sentence, rate * 0.9)} />
        <label htmlFor={`dictation-${index}`} className="text-sm font-semibold">
          Câu {index + 1}: nghe và chép lại
        </label>
      </div>
      <textarea
        id={`dictation-${index}`}
        rows={2}
        value={typed}
        onChange={(e) => {
          setTyped(e.target.value);
          setResult(null);
        }}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Gõ những gì bạn nghe được…"
        className="w-full resize-none rounded-2xl border-2 border-border bg-surface px-4 py-3 text-[16px] focus:border-primary focus:outline-none"
      />
      <Button size="sm" variant="secondary" disabled={!typed.trim()} onClick={check} className="self-start">
        Kiểm tra
      </Button>
      {result && (
        <div role="status" className="rounded-2xl bg-surface-muted p-3">
          <p className={cn('text-sm font-bold', result.perfect ? 'text-success' : 'text-text')}>
            {result.perfect ? 'Chính xác hoàn toàn!' : `Đúng ${result.score}% số từ`}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed">
            {result.words.map((w, i) => (
              <span key={i} className={cn('mr-1', w.correct ? 'text-success' : 'rounded bg-danger-soft px-0.5 text-danger')}>
                {w.text}
              </span>
            ))}
          </p>
          {result.extra.length > 0 && <p className="mt-1 text-xs text-text-muted">Từ thừa hoặc sai chính tả: {result.extra.join(', ')}</p>}
        </div>
      )}
    </Card>
  );
}

export default function ListeningActivityPage() {
  const { activity, isPending, isError, refetch, vocabulary, progress } = useActivityPage('listening');
  const completeActivity = useProgressStore((s) => s.completeActivity);
  const ttsSupported = isSpeechSynthesisSupported();
  const [rate, setRate] = useState<number>(1);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(!ttsSupported);
  const [showTranslation, setShowTranslation] = useState(false);
  const [dictationScores, setDictationScores] = useState<Record<number, number>>({});
  const words = useMemo(() => vocabulary.filter((v) => activity?.vocabularyIds.includes(v.id)), [vocabulary, activity]);
  const sheet = useWordSheet(words);

  useEffect(() => () => stopSpeaking(), []);

  if (isPending) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!activity) return <EmptyState icon={<Volume2 className="size-7" />} title="Không tìm thấy bài nghe" action={<ButtonLink to="/listening">Về Luyện nghe</ButtonLink>} />;

  const lines = activity.lines;
  const playAll = () => {
    speakLines(
      lines.map((l) => l.en),
      { rate: rate * 0.95, voiceFor: (i) => (lines[i]!.speaker === 'B' ? 1 : 0), onLine: setPlaying, onEnd: () => setPlaying(null) },
    );
  };
  const scores = Object.values(dictationScores);
  const dictationAverage = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;

  return (
    <article className="flex flex-col gap-6 animate-fade-up pb-4">
      <div>
        <ActivityHeader activity={activity} done={Boolean(progress)} />

        <Card className="flex flex-col gap-4">
          {ttsSupported ? (
            <div className="flex flex-wrap items-center gap-2">
              {playing === null ? (
                <Button leftIcon={<Play className="size-4" />} onClick={playAll}>
                  Nghe cả đoạn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  leftIcon={<Square className="size-4" />}
                  onClick={() => {
                    stopSpeaking();
                    setPlaying(null);
                  }}
                >
                  Dừng
                </Button>
              )}
              <div role="radiogroup" aria-label="Tốc độ" className="flex rounded-xl bg-surface-muted p-1">
                {RATES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={rate === r}
                    onClick={() => setRate(r)}
                    className={cn('min-h-9 rounded-lg px-2.5 text-sm font-semibold tabular-nums', rate === r ? 'bg-surface text-text shadow-card' : 'text-text-muted')}
                  >
                    {r}×
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Trình duyệt này chưa hỗ trợ đọc văn bản, nên lời thoại được hiển thị để bạn luyện đọc hiểu.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {ttsSupported && (
              <Button size="sm" variant="ghost" leftIcon={showTranscript ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => setShowTranscript((v) => !v)}>
                {showTranscript ? 'Ẩn lời thoại' : 'Hiện lời thoại'}
              </Button>
            )}
            {showTranscript && (
              <Button size="sm" variant="ghost" leftIcon={<Languages className="size-4" />} onClick={() => setShowTranslation((v) => !v)}>
                {showTranslation ? 'Ẩn bản dịch' : 'Hiện bản dịch'}
              </Button>
            )}
          </div>
          {!showTranscript && <p className="text-sm text-text-muted">Mẹo: nghe 2–3 lần trước khi xem lời thoại.</p>}
          {showTranscript && (
            <ol className="flex flex-col gap-2">
              {lines.map((line, i) => (
                <li key={i} className={cn('flex items-start gap-2 rounded-2xl p-2 transition-colors', playing === i && 'bg-primary-soft')}>
                  <span className={cn('mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', line.speaker === 'B' ? 'bg-secondary-soft text-secondary' : 'bg-primary-soft text-primary')}>
                    {line.speaker}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[15px] leading-relaxed">
                      <HighlightedText text={line.en} words={words} onWord={sheet.open} />
                    </p>
                    {showTranslation && <p className="mt-0.5 text-sm text-text-muted">{line.vi}</p>}
                  </div>
                  {ttsSupported && <IconButton label={`Nghe câu ${i + 1}`} icon={<Volume2 className="size-4" />} onClick={() => speak(line.en, rate * 0.95)} />}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <section aria-labelledby="questions">
        <SectionTitle id="questions" title="Câu hỏi nghe hiểu" />
        <ButtonLink to={`/practice/${activity.exerciseId}?from=${encodeURIComponent(`/listening/${activity.id}`)}`} fullWidth leftIcon={<Dumbbell className="size-5" />}>
          Trả lời câu hỏi
        </ButtonLink>
      </section>

      {ttsSupported && activity.dictation.length > 0 && (
        <section aria-labelledby="dictation" className="flex flex-col gap-3">
          <SectionTitle id="dictation" title="Nghe chép chính tả" />
          {activity.dictation.map((sentence, i) => (
            <DictationItem key={i} sentence={sentence} index={i} rate={rate} onChecked={(score) => setDictationScores((s) => ({ ...s, [i]: score }))} />
          ))}
        </section>
      )}

      <Button
        size="lg"
        variant="success"
        leftIcon={<CheckCircle2 className="size-5" />}
        onClick={() => {
          completeActivity({ id: activity.id, title: `Nghe: ${activity.titleVi}`, minutes: 5, score: dictationAverage });
          toast.success('Đã ghi nhận buổi luyện nghe');
        }}
      >
        Hoàn thành bài nghe
      </Button>

      <WordDetailSheet {...sheet.props} />
    </article>
  );
}
