import { ClipboardCheck, History } from 'lucide-react';
import { LevelBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { formatRelative } from '@/lib/date';
import { skillLabelVi } from '@/lib/placement';
import { useProgressStore } from '@/stores/progressStore';
import { ASSESSMENT_SKILLS } from '@/types/content';

export default function AssessmentsPage() {
  const results = useProgressStore((s) => s.assessmentResults);
  const latest = results[0];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Kiểm tra trình độ" subtitle="Bài kiểm tra xếp lớp và lịch sử kết quả" backTo="/profile" />

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ClipboardCheck className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-bold">Bài kiểm tra xếp lớp</h2>
            <p className="text-sm text-text-muted">24 câu · khoảng 12 phút · từ vựng, ngữ pháp, đọc, nghe, viết câu</p>
          </div>
        </div>
        <ButtonLink to="/placement-test" fullWidth>
          {latest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra'}
        </ButtonLink>
        <p className="text-xs text-text-muted">Kết quả là ước lượng để gợi ý lộ trình, không phải chứng chỉ CEFR chính thức.</p>
      </Card>

      <section aria-labelledby="history">
        <SectionTitle id="history" title="Lịch sử" />
        {results.length === 0 ? (
          <Card>
            <EmptyState icon={<History className="size-7" />} title="Chưa có kết quả nào" description="Kết quả các lần làm bài kiểm tra sẽ được lưu ở đây." />
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-border">
              {results.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={r.estimatedLevel} className="px-2.5 py-1 text-sm" />
                    <span className="min-w-0 flex-1 text-sm text-text-muted">{formatRelative(r.completedAt)}</span>
                    <span className="text-sm font-bold tabular-nums">{r.score}%</span>
                  </div>
                  <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                    {ASSESSMENT_SKILLS.filter((s) => r.skillScores[s] !== undefined).map((s) => (
                      <span key={s}>
                        {skillLabelVi[s]} {r.skillScores[s]}%
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
