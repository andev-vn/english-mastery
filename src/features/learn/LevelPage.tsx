import { ChevronRight, Layers } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { ButtonLink } from '@/components/ui/Button';
import { useLevels } from '@/services/contentQueries';
import { useModuleSummaries } from './useLevelProgress';

export default function LevelPage() {
  const { levelId = '' } = useParams();
  const levelsQuery = useLevels();
  const { summaries, isPending, isError, refetch } = useModuleSummaries();

  if (levelsQuery.isPending || isPending) return <PageSkeleton />;
  if (levelsQuery.isError || isError || !summaries) return <ErrorState onRetry={refetch} />;

  const level = levelsQuery.data.find((l) => l.id === levelId.toUpperCase());
  if (!level) {
    return (
      <EmptyState
        icon={<Layers className="size-7" />}
        title="Không tìm thấy cấp độ"
        description="Cấp độ này không tồn tại."
        action={<ButtonLink to="/learning-path">Xem lộ trình</ButtonLink>}
      />
    );
  }

  const levelModules = summaries.filter((s) => s.module.levelId === level.id);

  return (
    <div className="animate-fade-up">
      <PageHeader title={`${level.id} · ${level.nameVi}`} subtitle={level.description} backTo="/learning-path" />
      {levelModules.length === 0 ? (
        <EmptyState icon={<Layers className="size-7" />} title="Nội dung đang được biên soạn" description="Các chủ đề cho cấp độ này sẽ sớm được bổ sung." />
      ) : (
        <ol className="flex flex-col gap-3">
          {levelModules.map(({ module, lessons, completed, percent }, i) => (
            <li key={module.id}>
              <Link to={`/modules/${module.id}`} className="block">
                <Card interactive>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">{module.titleVi}</h2>
                        {module.category === 'developer' && <Badge tone="secondary">Developer</Badge>}
                      </div>
                      <p className="text-sm text-text-muted">{module.description}</p>
                    </div>
                    <ChevronRight className="mt-2 size-5 shrink-0 text-text-muted" aria-hidden />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar value={percent} size="sm" tone={percent === 100 ? 'success' : 'primary'} label={`Tiến độ ${module.titleVi}`} />
                    <span className="shrink-0 text-xs font-medium text-text-muted tabular-nums">
                      {completed}/{lessons.length}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
