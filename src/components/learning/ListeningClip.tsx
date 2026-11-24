import { useState } from 'react';
import { Eye, EyeOff, Headphones, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { isSpeechSynthesisSupported, speak } from '@/lib/speech';

interface ListeningClipProps {
  text: string;
  /** Hide the transcript until the learner asks for it (it reveals the answer). */
  hideTranscript?: boolean;
}

const RATES = [
  { value: 0.75, label: 'Chậm' },
  { value: 1, label: 'Bình thường' },
] as const;

/**
 * Plays a listening text with the browser's speech synthesis (free, on-device).
 * Falls back to showing the transcript when the browser has no voice.
 */
export function ListeningClip({ text, hideTranscript = true }: ListeningClipProps) {
  const supported = isSpeechSynthesisSupported();
  const [rate, setRate] = useState<number>(1);
  const [plays, setPlays] = useState(0);
  const [showTranscript, setShowTranscript] = useState(!supported || !hideTranscript);

  return (
    <section aria-label="Đoạn nghe" className="rounded-card border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-text-muted">
        <Headphones className="size-4" aria-hidden /> Nghe đoạn hội thoại
      </p>
      {supported ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            leftIcon={<Play className="size-4" />}
            onClick={() => {
              speak(text, rate * 0.95);
              setPlays((n) => n + 1);
            }}
          >
            {plays === 0 ? 'Nghe' : 'Nghe lại'}
          </Button>
          <div role="radiogroup" aria-label="Tốc độ" className="flex rounded-xl bg-surface-muted p-1">
            {RATES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={rate === r.value}
                onClick={() => setRate(r.value)}
                className={cn(
                  'min-h-9 rounded-lg px-3 text-sm font-semibold transition-colors',
                  rate === r.value ? 'bg-surface text-text shadow-card' : 'text-text-muted',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-muted">Trình duyệt này chưa hỗ trợ đọc văn bản, nên lời thoại được hiển thị bên dưới.</p>
      )}
      {supported && (
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
          aria-expanded={showTranscript}
        >
          {showTranscript ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {showTranscript ? 'Ẩn lời thoại' : 'Hiện lời thoại'}
        </button>
      )}
      {showTranscript && <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2.5 text-[15px] italic">{text}</p>}
    </section>
  );
}
