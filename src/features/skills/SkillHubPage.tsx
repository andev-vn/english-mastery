import { useState } from 'react';
import { CheckCircle2, ChevronRight, SearchX } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Badge, LevelBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useActivities } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { ACTIVITY_CATEGORIES, type ActivityCategory, type SkillActivity } from '@/types/content';
import { categoryLabel, isSkill, skillMeta } from './meta';

export function ActivityCard({ activity }: { activity: SkillActivity }) {
  const progress = useProgressStore((s) => s.activityProgress[activity.id]);
  const meta = skillMeta[activity.skill];
  const Icon = meta.icon;
  return (
    <Link to={`/${activity.skill}/${activity.id}`} className="block">
      <Card interactive padding="sm" className="flex items-center gap-3.5">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}>
          <Icon className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold">{activity.titleVi}</span>
            <LevelBadge level={activity.level} />
          </span>
          <span className="block truncate text-sm text-text-muted">{activity.description}</span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
            <span>{categoryLabel[activity.category]}</span>
            {progress && (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {progress.bestScore !== undefined ? `${progress.bestScore}%` : 'Đã luyện'}
              </span>
            )}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
      </Card>
    </Link>
  );
}

/** Hub for one skill (/listening, /speaking, /reading, /writing), filterable by category. */
export default function SkillHubPage() {
  const segment = useLocation().pathname.split('/')[1];
  const skill = isSkill(segment) ? segment : undefined;
  const query = useActivities(skill);
  const [category, setCategory] = useState<'all' | ActivityCategory>('all');

  if (!skill) return <EmptyState icon={<SearchX className="size-7" />} title="Không tìm thấy kỹ năng" action={<ButtonLink to="/practice">Về Luyện tập</ButtonLink>} />;
  if (query.isPending) return <PageSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const meta = skillMeta[skill];
  const present = ACTIVITY_CATEGORIES.filter((c) => query.data.some((a) => a.category === c));
  const list = query.data.filter((a) => category === 'all' || a.category === category);

  return (
    <div className="animate-fade-up">
      <PageHeader title={`Luyện ${meta.label.toLowerCase()}`} subtitle={meta.description} backTo="/practice" />
      {present.length > 1 && (
        <Tabs
          label="Lọc theo chủ đề"
          value={category}
          onChange={setCategory}
          items={[{ value: 'all' as const, label: 'Tất cả' }, ...present.map((c) => ({ value: c, label: categoryLabel[c] }))]}
          className="mb-5"
        />
      )}
      {skill === 'speaking' && (
        <p className="mb-4 text-sm text-text-muted">
          Nhận dạng giọng nói hoạt động trên Chrome, Edge và Safari khi được cấp quyền micro. Trên trình duyệt khác, bạn vẫn luyện được bằng cách gõ câu trả lời.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {list.map((a) => (
          <li key={a.id}>
            <ActivityCard activity={a} />
          </li>
        ))}
      </ul>
      {list.length === 0 && <EmptyState icon={<SearchX className="size-7" />} title="Chưa có bài luyện cho mục này" />}
      <p className="mt-6 flex items-center gap-2 text-xs text-text-muted">
        <Badge tone="neutral">{query.data.length}</Badge> bài luyện {meta.label.toLowerCase()}
        {query.data.length > 0 && ` · ${query.data[0]!.level}–${query.data[query.data.length - 1]!.level}`}
      </p>
    </div>
  );
}
