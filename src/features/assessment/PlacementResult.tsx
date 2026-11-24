import { useMemo } from 'react';
import { CheckCircle2, ChevronRight, Info, RotateCcw, TrendingUp, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { toast } from '@/components/ui/Toast';
import { skillLabelVi, type PlacementScore } from '@/lib/placement';
import { recommendLessons } from '@/lib/progress';
import { useLessons, useLevels } from '@/services/contentQueries';
import { useProgressStore } from '@/stores/progressStore';
import { ASSESSMENT_SKILLS, CEFR_LEVELS, type AssessmentSkill } from '@/types/content';

/** Where to practise each skill when it is a weakness. */
const practiceLink: Record<AssessmentSkill, { to: string; label: string }> = {
  vocabulary: { to: '/vocabulary', label: 'Học từ vựng' },
  grammar: { to: '/grammar', label: 'Ôn ngữ pháp' },
  reading: { to: '/practice', label: 'Luyện đọc hiểu' },
  listening: { to: '/practice', label: 'Luyện nghe' },
  writing: { to: '/practice', label: 'Luyện viết câu' },
};

interface PlacementResultProps {
  score: PlacementScore;
  onRetake: () => void;
}

export function PlacementResult({ score, onRetake }: PlacementResultProps) {
  const profileLevel = useProgressStore((s) => s.profile.level);
  const lessonsProgress = useProgressStore((s) => s.lessons);
  const profile = useProgressStore((s) => s.profile);
  const updateProfile = useProgressStore((s) => s.updateProfile);
  const levelsQuery = useLevels();
  const lessonsQuery = useLessons();
  const levelInfo = levelsQuery.data?.find((l) => l.id === score.estimatedLevel);

  const firstLesson = useMemo(
    () =>
      lessonsQuery.data
        ? recommendLessons(lessonsQuery.data, { lessons: lessonsProgress, profile: { ...profile, level: score.estimatedLevel } }, 1)[0]
        : undefined,
    [lessonsQuery.data, lessonsProgress, profile, score.estimatedLevel],
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <section className="flex flex-col items-center pt-4 text-center" aria-labelledby="estimate">
        <p className="text-sm font-semibold text-text-muted">Trình độ ước lượng</p>
        <h1 id="estimate" className="mt-2 flex size-28 items-center justify-center rounded-[2rem] bg-primary text-5xl font-extrabold text-on-primary">
          {score.estimatedLevel}
        </h1>
        {levelInfo && <p className="mt-3 text-lg font-bold">{levelInfo.nameVi}</p>}
        <p className="mt-2 max-w-sm text-[15px] text-text-subtle">
          {score.masteredLevel
            ? score.masteredLevel === score.estimatedLevel
              ? `Bạn làm tốt ở mọi cấp độ, kể cả ${score.masteredLevel}.`
              : `Bạn nắm chắc kiến thức đến ${score.masteredLevel}. Nên học tiếp từ ${score.estimatedLevel}.`
            : 'Nên bắt đầu từ A1 để xây nền tảng vững chắc.'}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {score.correct}/{score.total} câu đúng · {score.score}%
        </p>
      </section>

      <Card className="flex gap-3 bg-surface-muted" padding="sm">
        <Info className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />
        <p className="text-sm text-text-subtle">
          Đây là <strong>kết quả ước lượng</strong> từ {score.total} câu hỏi có đáp án cố định, không phải chứng chỉ CEFR chính thức.
          Kỹ năng nói chưa được đánh giá trong bài này.
        </p>
      </Card>

      <div className="flex flex-col gap-2.5">
        {profileLevel !== score.estimatedLevel && (
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              updateProfile({ level: score.estimatedLevel });
              toast.success(`Đã đặt trình độ của bạn là ${score.estimatedLevel}`);
            }}
          >
            Đặt trình độ của tôi là {score.estimatedLevel}
          </Button>
        )}
        {firstLesson && (
          <Link to={`/lessons/${firstLesson.id}`} className="block">
            <Card interactive className="flex items-center gap-3.5" padding="sm">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-text-muted uppercase">Bài học gợi ý</span>
                <span className="block truncate font-semibold">{firstLesson.titleVi}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
            </Card>
          </Link>
        )}
      </div>

      <section aria-labelledby="skills">
        <SectionTitle id="skills" title="Theo kỹ năng" />
        <Card className="flex flex-col gap-4">
          {ASSESSMENT_SKILLS.filter((s) => score.skillScores[s].total > 0).map((skill) => {
            const t = score.skillScores[skill];
            const pct = Math.round((t.correct / t.total) * 100);
            return (
              <div key={skill}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{skillLabelVi[skill]}</span>
                  <span className="text-text-muted tabular-nums">
                    {t.correct}/{t.total}
                  </span>
                </div>
                <ProgressBar value={pct} label={`${skillLabelVi[skill]}: ${pct}%`} tone={pct >= 75 ? 'success' : pct >= 50 ? 'primary' : 'warning'} />
              </div>
            );
          })}
        </Card>
      </section>

      {(score.strengths.length > 0 || score.weaknesses.length > 0) && (
        <section aria-labelledby="sw" className="grid gap-3 sm:grid-cols-2">
          <h2 id="sw" className="sr-only">
            Điểm mạnh và điểm cần cải thiện
          </h2>
          {score.strengths.length > 0 && (
            <Card padding="sm">
              <p className="flex items-center gap-1.5 text-sm font-bold text-success">
                <CheckCircle2 className="size-4" aria-hidden /> Điểm mạnh
              </p>
              <p className="mt-1.5 text-[15px]">{score.strengths.map((s) => skillLabelVi[s]).join(', ')}</p>
            </Card>
          )}
          {score.weaknesses.length > 0 && (
            <Card padding="sm">
              <p className="flex items-center gap-1.5 text-sm font-bold text-warning">
                <TriangleAlert className="size-4" aria-hidden /> Cần cải thiện
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {score.weaknesses.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-2 text-[15px]">
                    {skillLabelVi[s]}
                    <Link to={practiceLink[s].to} className="text-sm font-semibold text-primary">
                      {practiceLink[s].label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      <section aria-labelledby="levels">
        <SectionTitle id="levels" title="Theo cấp độ" />
        <Card padding="sm">
          <ul className="grid grid-cols-6 gap-1 text-center">
            {CEFR_LEVELS.map((level) => {
              const t = score.levelScores[level];
              const passed = t.total > 0 && t.correct / t.total >= 0.75;
              return (
                <li key={level} className={`rounded-xl py-2 ${passed ? 'bg-success-soft text-success' : 'bg-surface-muted text-text-muted'}`}>
                  <span className="block text-sm font-bold">{level}</span>
                  <span className="block text-xs tabular-nums">
                    {t.correct}/{t.total}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-1 text-xs text-text-muted">Một cấp độ được tính là nắm chắc khi đúng ít nhất 3/4 câu.</p>
        </Card>
      </section>

      <div className="flex flex-col gap-2.5 pb-2">
        <ButtonLink to="/learning-path" variant="outline" size="lg" fullWidth replace>
          Xem lộ trình học
        </ButtonLink>
        <Button variant="ghost" size="lg" fullWidth leftIcon={<RotateCcw className="size-4" />} onClick={onRetake}>
          Làm lại bài kiểm tra
        </Button>
      </div>
    </div>
  );
}
