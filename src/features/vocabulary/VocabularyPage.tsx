import { useCallback, useMemo, useState } from 'react';
import { Brain, ChevronRight, Search, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { VocabularyCard } from '@/components/learning/VocabularyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import { normalizeAnswer } from '@/lib/grading';
import { isDifficult, isDue } from '@/lib/srs';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useVocabulary, useVocabularyTopics } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { CEFR_LEVELS } from '@/types/content';
import { WordDetailSheet } from './WordDetailSheet';

type ListFilter = 'all' | 'saved' | 'favorite' | 'difficult';
const PAGE_SIZE = 20;

export default function VocabularyPage() {
  const vocabQuery = useVocabulary();
  const topicsQuery = useVocabularyTopics();
  const cards = useProgressStore((s) => s.cards);
  const saveWord = useProgressStore((s) => s.saveWord);
  const removeWord = useProgressStore((s) => s.removeWord);
  const toggleFavorite = useProgressStore((s) => s.toggleFavorite);

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [list, setList] = useState<ListFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const query = useDebouncedValue(search, 200);

  const onToggleSave = useCallback(
    (id: string) => {
      if (useProgressStore.getState().cards[id]) {
        removeWord(id);
        toast.info('Đã bỏ khỏi danh sách ôn tập');
      } else {
        saveWord(id);
        toast.success('Đã lưu — từ này sẽ xuất hiện trong phần ôn tập');
      }
    },
    [removeWord, saveWord],
  );

  const filtered = useMemo(() => {
    const words = vocabQuery.data ?? [];
    const q = normalizeAnswer(query);
    return words.filter((w) => {
      const card = cards[w.id];
      if (list === 'saved' && !card) return false;
      if (list === 'favorite' && !card?.favorite) return false;
      if (list === 'difficult' && !(card && isDifficult(card))) return false;
      if (level !== 'all' && w.level !== level) return false;
      if (topic !== 'all' && w.topic !== topic) return false;
      if (q && !normalizeAnswer(w.word).includes(q) && !normalizeAnswer(w.meaningVi).includes(q)) return false;
      return true;
    });
  }, [vocabQuery.data, cards, list, level, topic, query]);

  if (vocabQuery.isPending || topicsQuery.isPending) return <PageSkeleton />;
  if (vocabQuery.isError || topicsQuery.isError) {
    return <ErrorState onRetry={() => { void vocabQuery.refetch(); void topicsQuery.refetch(); }} />;
  }

  const cardList = Object.values(cards);
  const due = cardList.filter((c) => isDue(c)).length;
  const counts = {
    saved: cardList.length,
    favorite: cardList.filter((c) => c.favorite).length,
    difficult: cardList.filter(isDifficult).length,
  };
  const topicName = (id: string) => topicsQuery.data.find((t) => t.id === id)?.nameVi;
  const openEntry = vocabQuery.data.find((w) => w.id === openId);
  const resetPaging = () => setVisible(PAGE_SIZE);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Từ vựng" subtitle={`${vocabQuery.data.length} từ · ${counts.saved} đã lưu`} />

      <Link to="/vocabulary/review" className="mb-5 block">
        <Card interactive className="flex items-center gap-4 bg-secondary text-white">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Brain className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Ôn tập flashcard</span>
            <span className="block text-sm opacity-90">{due > 0 ? `${due} từ đến hạn ôn hôm nay` : counts.saved > 0 ? 'Chưa có từ đến hạn — ôn thêm nếu muốn' : 'Lưu từ để bắt đầu ôn tập'}</span>
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </Card>
      </Link>

      <div className="flex flex-col gap-3">
        <Input
          type="search"
          placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…"
          aria-label="Tìm từ vựng"
          leftIcon={<Search className="size-5" />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPaging();
          }}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Select
            aria-label="Lọc theo cấp độ"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              resetPaging();
            }}
            options={[{ value: 'all', label: 'Mọi cấp độ' }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))]}
          />
          <Select
            aria-label="Lọc theo chủ đề"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              resetPaging();
            }}
            options={[{ value: 'all', label: 'Mọi chủ đề' }, ...topicsQuery.data.map((t) => ({ value: t.id, label: t.nameVi }))]}
          />
        </div>
        <Tabs
          label="Danh sách từ"
          value={list}
          onChange={(v) => {
            setList(v);
            resetPaging();
          }}
          items={[
            { value: 'all', label: 'Tất cả' },
            { value: 'saved', label: 'Đã lưu', count: counts.saved },
            { value: 'favorite', label: 'Yêu thích', count: counts.favorite },
            { value: 'difficult', label: 'Khó', count: counts.difficult },
          ]}
        />
      </div>

      <p className="mt-4 mb-2.5 text-sm text-text-muted" aria-live="polite">
        {filtered.length} kết quả
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-7" />}
          title="Không có từ nào phù hợp"
          description={list === 'difficult' ? 'Những từ bạn hay quên khi ôn tập sẽ xuất hiện ở đây.' : 'Hãy thử từ khoá hoặc bộ lọc khác.'}
        />
      ) : (
        <>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {filtered.slice(0, visible).map((entry) => (
              <li key={entry.id}>
                <VocabularyCard
                  entry={entry}
                  saved={Boolean(cards[entry.id])}
                  favorite={Boolean(cards[entry.id]?.favorite)}
                  onToggleSave={onToggleSave}
                  onToggleFavorite={toggleFavorite}
                  onOpen={setOpenId}
                />
              </li>
            ))}
          </ul>
          {visible < filtered.length && (
            <Button variant="outline" fullWidth className="mt-4" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Xem thêm ({filtered.length - visible})
            </Button>
          )}
        </>
      )}

      <WordDetailSheet
        entry={openEntry}
        card={openId ? cards[openId] : undefined}
        topicName={openEntry ? topicName(openEntry.topic) : undefined}
        onClose={() => setOpenId(null)}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}
