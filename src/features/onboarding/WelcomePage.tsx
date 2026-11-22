import { BookOpenCheck, Brain, Sparkles, WifiOff } from 'lucide-react';
import { Navigate } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useProgressStore } from '@/stores/progressStore';

const highlights = [
  { icon: BookOpenCheck, title: 'Lộ trình A1 → C2', text: 'Bài học theo chuẩn CEFR, giải thích bằng tiếng Việt.' },
  { icon: Brain, title: 'Ôn tập thông minh', text: 'Lặp lại ngắt quãng giúp nhớ từ vựng lâu hơn.' },
  { icon: WifiOff, title: 'Học cả khi ngoại tuyến', text: 'Cài đặt như ứng dụng trên điện thoại và máy tính.' },
];

export default function WelcomePage() {
  const onboarded = useProgressStore((s) => s.profile.onboarded);
  if (onboarded) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-4">
        <Logo />
      </div>

      <section className="flex flex-1 flex-col justify-center py-10">
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary">
          <Sparkles className="size-3.5" aria-hidden /> Miễn phí · Không cần thẻ
        </span>
        <h1 className="text-[32px] leading-[1.15] font-extrabold tracking-tight text-balance">
          Learn English.
          <br />
          <span className="text-primary">Build Confidence.</span>
          <br />
          Speak Naturally.
        </h1>
        <p className="mt-4 text-base text-text-subtle">
          Lấy lại nền tảng tiếng Anh và tiến bộ mỗi ngày với lộ trình được thiết kế cho người Việt.
        </p>

        <ul className="mt-8 flex flex-col gap-4">
          {highlights.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 pb-2">
        <ButtonLink to="/onboarding" size="lg" fullWidth>
          Bắt đầu học
        </ButtonLink>
        <p className="text-center text-xs text-text-muted">
          Bạn đang dùng chế độ khách: tiến độ được lưu trên thiết bị này. Tính năng tài khoản sẽ sớm có để đồng bộ giữa các thiết bị.
        </p>
      </div>
    </div>
  );
}
