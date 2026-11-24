import { CheckCircle2 } from 'lucide-react';
import { Badge, LevelBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import type { SkillActivity } from '@/types/content';
import { categoryLabel, skillMeta } from './meta';

export function ActivityHeader({ activity, done }: { activity: SkillActivity; done: boolean }) {
  return (
    <>
      <PageHeader
        title={activity.titleVi}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <LevelBadge level={activity.level} />
            <Badge tone="neutral">{skillMeta[activity.skill].label}</Badge>
            <Badge tone="secondary">{categoryLabel[activity.category]}</Badge>
            {done && (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="size-4" aria-hidden /> Đã luyện
              </span>
            )}
          </span>
        }
        backTo={`/${activity.skill}`}
      />
      <p className="-mt-2 mb-5 text-[15px] text-text-subtle">
        {activity.title} — {activity.description}
      </p>
    </>
  );
}
