import { CircleAlert, Dumbbell, Lightbulb, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { SpeakButton } from '@/components/learning/SpeakButton';
import { partOfSpeechVi } from '@/components/learning/VocabularyCard';
import { useExercises, useVocabulary } from '@/services/contentQueries';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ContentBlock } from '@/types/content';

function VocabularyBlock({ wordIds }: { wordIds: string[] }) {
  const { data } = useVocabulary();
  const words = data?.filter((w) => wordIds.includes(w.id)) ?? [];
  if (words.length === 0) return null;
  return (
    <section aria-label="Từ vựng trong bài" className="rounded-card border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold tracking-wide text-text-muted uppercase">Từ vựng</h3>
      <ul className="divide-y divide-border">
        {words.map((w) => (
          <li key={w.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {w.word} <span className="text-sm font-normal text-text-muted">{w.ipa}</span>
              </p>
              <p className="text-sm text-text-subtle">
                <span className="italic">{partOfSpeechVi(w.partOfSpeech)}</span> · {w.meaningVi}
              </p>
            </div>
            <SpeakButton text={w.word} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseBlock({ exerciseId, lessonId }: { exerciseId: string; lessonId: string }) {
  const { data } = useExercises();
  const exercise = data?.find((e) => e.id === exerciseId);
  if (!exercise) return null;
  return (
    <Link
      to={`/practice/${exercise.id}?lesson=${lessonId}`}
      className="flex items-center gap-4 rounded-card border-2 border-primary/30 bg-primary-soft p-4 transition-colors hover:border-primary"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
        <Dumbbell className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Luyện tập: {exercise.titleVi}</span>
        <span className="block text-sm text-text-subtle">
          {exercise.questions.length} câu hỏi · {exercise.estimatedMinutes} phút
        </span>
      </span>
      <ChevronRight className="size-5 text-primary" aria-hidden />
    </Link>
  );
}

export function ContentBlocks({ blocks, lessonId }: { blocks: ContentBlock[]; lessonId: string }) {
  const showTranslations = useSettingsStore((s) => s.showTranslations);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`;
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={key} className="mt-3 text-lg font-bold">
                {block.text}
              </h2>
            );
          case 'text':
            return (
              <p key={key} className="text-[15px] leading-relaxed text-text-subtle">
                {block.text}
              </p>
            );
          case 'grammar':
            return (
              <section key={key} className="rounded-card border border-border bg-surface p-4 shadow-card">
                <h3 className="text-sm font-bold text-primary">{block.title}</h3>
                <p className="mt-2 rounded-xl bg-primary-soft px-3 py-2.5 font-mono text-[14px] font-semibold text-text">{block.structure}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-text-subtle">{block.explanationVi}</p>
              </section>
            );
          case 'example':
            return (
              <div key={key} className="flex items-start gap-2 rounded-2xl bg-surface-muted py-2 pr-2 pl-4">
                <div className="min-w-0 flex-1 py-1">
                  <p className="text-[15px] font-semibold">{block.en}</p>
                  {showTranslations && <p className="mt-0.5 text-sm text-text-muted">{block.vi}</p>}
                  {block.note && <p className="mt-1 text-xs text-text-muted italic">{block.note}</p>}
                </div>
                <SpeakButton text={block.en} className="bg-surface" />
              </div>
            );
          case 'mistake':
            return (
              <section key={key} className="rounded-card border border-danger/25 bg-danger-soft/50 p-4" aria-label="Lỗi thường gặp">
                <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-danger uppercase">
                  <CircleAlert className="size-4" aria-hidden /> Lỗi thường gặp
                </p>
                <p className="mt-2 text-[15px]">
                  <span className="mr-1.5 font-bold text-danger" aria-label="Sai">✗</span>
                  <span className="line-through decoration-danger/60">{block.wrong}</span>
                </p>
                <p className="mt-1 text-[15px] font-semibold">
                  <span className="mr-1.5 font-bold text-success" aria-label="Đúng">✓</span>
                  {block.right}
                </p>
                <p className="mt-2 text-sm text-text-subtle">{block.explanationVi}</p>
              </section>
            );
          case 'tip':
            return (
              <aside key={key} className="flex gap-3 rounded-card bg-warning-soft p-4">
                <Lightbulb className="size-5 shrink-0 text-warning" aria-hidden />
                <p className="text-sm leading-relaxed">{block.text}</p>
              </aside>
            );
          case 'vocabulary':
            return <VocabularyBlock key={key} wordIds={block.wordIds} />;
          case 'exercise':
            return <ExerciseBlock key={key} exerciseId={block.exerciseId} lessonId={lessonId} />;
        }
      })}
    </div>
  );
}
