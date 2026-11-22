import { BookOpen, BookX, Dumbbell } from 'lucide-react';
import { useParams } from 'react-router';
import { LevelBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { ContentBlocks } from '@/features/learn/ContentBlocks';
import { useGrammarTopics, useLesson } from '@/services/contentQueries';
import type { ContentBlock } from '@/types/content';

/** Reference view: only the explanation blocks (structures, examples, mistakes, tips) of the linked lesson. */
const REFERENCE_BLOCKS = new Set<ContentBlock['type']>(['heading', 'grammar', 'example', 'mistake', 'tip']);

export default function GrammarTopicPage() {
  const { topicId = '' } = useParams();
  const topicsQuery = useGrammarTopics();
  const topic = topicsQuery.data?.find((t) => t.id === topicId);
  const lessonQuery = useLesson(topic?.lessonId ?? '');

  if (topicsQuery.isPending || (topic && lessonQuery.isPending)) return <PageSkeleton />;
  if (topicsQuery.isError || lessonQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void topicsQuery.refetch();
          void lessonQuery.refetch();
        }}
      />
    );
  }

  const lesson = lessonQuery.data;
  if (!topic || !lesson) {
    return (
      <EmptyState
        icon={<BookX className="size-7" />}
        title="Không tìm thấy chủ điểm ngữ pháp"
        action={<ButtonLink to="/grammar">Về mục Ngữ pháp</ButtonLink>}
      />
    );
  }

  const blocks = lesson.blocks.filter((b) => REFERENCE_BLOCKS.has(b.type));
  const exerciseId = lesson.exerciseIds[0];

  return (
    <article className="animate-fade-up">
      <PageHeader
        title={topic.titleVi}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <LevelBadge level={topic.level} /> {topic.title}
          </span>
        }
        backTo="/grammar"
      />
      <p className="mb-5 text-[15px] text-text-subtle">{topic.summaryVi}</p>

      <ContentBlocks blocks={blocks} lessonId={lesson.id} />

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        {exerciseId && (
          <ButtonLink to={`/practice/${exerciseId}`} size="lg" fullWidth leftIcon={<Dumbbell className="size-5" />}>
            Luyện tập chủ điểm này
          </ButtonLink>
        )}
        <ButtonLink to={`/lessons/${lesson.id}`} size="lg" variant="outline" fullWidth leftIcon={<BookOpen className="size-5" />}>
          Học cả bài
        </ButtonLink>
      </div>
    </article>
  );
}
