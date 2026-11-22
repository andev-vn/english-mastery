import { Bookmark, BookmarkCheck } from 'lucide-react';
import { SpeakButton } from '@/components/learning/SpeakButton';
import { partOfSpeechVi } from '@/components/learning/VocabularyCard';
import { LevelBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/Dialog';
import type { VocabularyEntry } from '@/types/content';
import type { ReviewCard } from '@/types/progress';

interface WordDetailSheetProps {
  entry: VocabularyEntry | undefined;
  card: ReviewCard | undefined;
  topicName?: string;
  onClose: () => void;
  onToggleSave: (id: string) => void;
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-bold tracking-wide text-text-muted uppercase">{title}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <li key={s} className="rounded-lg bg-surface-muted px-2.5 py-1 text-sm">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WordDetailSheet({ entry, card, topicName, onClose, onToggleSave }: WordDetailSheetProps) {
  return (
    <BottomSheet
      open={Boolean(entry)}
      onClose={onClose}
      title={entry?.word ?? ''}
      description={entry ? `${entry.ipa} · ${partOfSpeechVi(entry.partOfSpeech)}` : undefined}
      footer={
        entry && (
          <Button
            fullWidth
            variant={card ? 'outline' : 'primary'}
            leftIcon={card ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
            onClick={() => onToggleSave(entry.id)}
          >
            {card ? 'Bỏ khỏi danh sách ôn tập' : 'Lưu để ôn tập'}
          </Button>
        )
      }
    >
      {entry && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <LevelBadge level={entry.level} />
            {topicName && <span className="text-sm text-text-muted">{topicName}</span>}
            <SpeakButton text={entry.word} className="ml-auto" />
          </div>
          <div>
            <p className="text-xl font-bold">{entry.meaningVi}</p>
            <p className="mt-1 text-[15px] text-text-subtle">{entry.definition}</p>
          </div>
          <div className="flex items-start gap-2 rounded-2xl bg-surface-muted py-2 pr-2 pl-4">
            <div className="flex-1 py-1">
              <p className="font-semibold">{entry.example}</p>
              <p className="mt-0.5 text-sm text-text-muted">{entry.exampleVi}</p>
            </div>
            <SpeakButton text={entry.example} className="bg-surface" />
          </div>
          <Chips title="Cụm từ thường gặp" items={entry.collocations} />
          <Chips title="Từ đồng nghĩa" items={entry.synonyms} />
          <Chips title="Từ trái nghĩa" items={entry.antonyms} />
          {card && (
            <p className="text-xs text-text-muted">
              Đã ôn {card.repetitions} lần liên tiếp · Lần ôn tiếp theo: {new Date(card.nextReviewAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
