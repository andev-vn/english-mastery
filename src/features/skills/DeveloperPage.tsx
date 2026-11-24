import { ChevronRight, Code2 } from 'lucide-react';
import { Link } from 'react-router';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { useActivities, useModules } from '@/services/contentQueries';
import { SKILLS } from '@/types/content';
import { ActivityCard } from './SkillHubPage';
import { skillMeta } from './meta';

/** Developer English: lessons, stand-ups, code reviews, bug reports and technical interviews in one place. */
export default function DeveloperPage() {
  const activitiesQuery = useActivities();
  const modulesQuery = useModules();

  if (activitiesQuery.isPending || modulesQuery.isPending) return <PageSkeleton />;
  if (activitiesQuery.isError || modulesQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void activitiesQuery.refetch();
          void modulesQuery.refetch();
        }}
      />
    );
  }

  const devActivities = activitiesQuery.data.filter((a) => a.category === 'developer' || a.category === 'interview');
  const devModules = modulesQuery.data.filter((m) => m.category === 'developer');

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Tiếng Anh cho lập trình viên" subtitle="Stand-up, code review, báo cáo lỗi và phỏng vấn kỹ thuật" backTo="/practice" />

      {devModules.length > 0 && (
        <section aria-labelledby="dev-lessons">
          <SectionTitle id="dev-lessons" title="Bài học" />
          <div className="flex flex-col gap-2.5">
            {devModules.map((m) => (
              <Link key={m.id} to={`/modules/${m.id}`} className="block">
                <Card interactive padding="sm" className="flex items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
                    <Code2 className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{m.titleVi}</span>
                    <span className="block truncate text-sm text-text-muted">{m.description}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {SKILLS.map((skill) => {
        const items = devActivities.filter((a) => a.skill === skill);
        if (items.length === 0) return null;
        return (
          <section key={skill} aria-labelledby={`dev-${skill}`}>
            <SectionTitle id={`dev-${skill}`} title={skillMeta[skill].label} />
            <ul className="flex flex-col gap-2.5">
              {items.map((a) => (
                <li key={a.id}>
                  <ActivityCard activity={a} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
