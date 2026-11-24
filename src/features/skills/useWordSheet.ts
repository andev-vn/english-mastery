import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/Toast';
import { useProgressStore } from '@/stores/progressStore';
import type { VocabularyEntry } from '@/types/content';

/** State for the word-detail bottom sheet opened from highlighted vocabulary. */
export function useWordSheet(words: VocabularyEntry[]) {
  const [openId, setOpenId] = useState<string | null>(null);
  const card = useProgressStore((s) => (openId ? s.cards[openId] : undefined));
  const saveWord = useProgressStore((s) => s.saveWord);
  const removeWord = useProgressStore((s) => s.removeWord);

  const onToggleSave = useCallback(
    (id: string) => {
      if (useProgressStore.getState().cards[id]) {
        removeWord(id);
        toast.info('Đã bỏ khỏi danh sách ôn tập');
      } else {
        saveWord(id);
        toast.success('Đã lưu để ôn tập');
      }
    },
    [removeWord, saveWord],
  );

  return {
    open: setOpenId,
    props: {
      entry: words.find((w) => w.id === openId),
      card,
      onClose: () => setOpenId(null),
      onToggleSave,
    },
  };
}
