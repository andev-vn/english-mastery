import { memo } from 'react';
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react';
import { LevelBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import type { VocabularyEntry } from '@/types/content';
import { SpeakButton } from './SpeakButton';

const posVi: Record<VocabularyEntry['partOfSpeech'], string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  pronoun: 'đại từ',
  preposition: 'giới từ',
  conjunction: 'liên từ',
  phrase: 'cụm từ',
};

export const partOfSpeechVi = (pos: VocabularyEntry['partOfSpeech']) => posVi[pos];

interface VocabularyCardProps {
  entry: VocabularyEntry;
  saved: boolean;
  favorite: boolean;
  onToggleSave: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpen?: (id: string) => void;
}

export const VocabularyCard = memo(function VocabularyCard({
  entry,
  saved,
  favorite,
  onToggleSave,
  onToggleFavorite,
  onOpen,
}: VocabularyCardProps) {
  return (
    <article className="relative rounded-card border border-border/70 bg-surface p-4 shadow-card transition-colors has-[>button:hover]:border-primary/40">
      {/* Stretched button: the whole card opens the detail view; action icons sit above it. */}
      <button
        type="button"
        onClick={() => onOpen?.(entry.id)}
        className="absolute inset-0 rounded-card"
        aria-label={`Xem chi tiết từ ${entry.word}`}
      />
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold">{entry.word}</span>
            <span className="text-sm text-text-muted">{entry.ipa}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-sm">
            <span className="text-text-muted italic">{posVi[entry.partOfSpeech]}</span>
            <LevelBadge level={entry.level} />
          </p>
        </div>
        <div className="relative z-10 -mt-1.5 -mr-2 flex items-center">
          <SpeakButton text={entry.word} />
          <IconButton
            label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            aria-pressed={favorite}
            icon={<Heart className={cn('size-5', favorite && 'fill-danger text-danger')} />}
            onClick={() => onToggleFavorite(entry.id)}
          />
          <IconButton
            label={saved ? 'Bỏ khỏi danh sách ôn tập' : 'Lưu để ôn tập'}
            aria-pressed={saved}
            icon={saved ? <BookmarkCheck className="size-5 text-primary" /> : <Bookmark className="size-5" />}
            onClick={() => onToggleSave(entry.id)}
          />
        </div>
      </div>
      <p className="mt-2 text-[15px] font-medium">{entry.meaningVi}</p>
      <p className="mt-0.5 text-sm text-text-subtle">“{entry.example}”</p>
    </article>
  );
});
