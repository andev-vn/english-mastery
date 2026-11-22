import { ChevronRight, CloudOff, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { useAuthStore } from '@/stores/authStore';

/** Account status on the Profile page: guest notice, sign-in prompt, or signed-in summary. */
export function AccountCard() {
  const status = useAuthStore((s) => s.status);
  const email = useAuthStore((s) => s.user?.email);

  if (status === 'loading') return <Skeleton className="h-24 rounded-card" />;

  if (status === 'signed_in') {
    return (
      <Link to="/account" className="block">
        <Card interactive className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
            <UserRoundCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Tài khoản</span>
            <span className="block truncate text-sm text-text-muted">{email}</span>
            <span className="mt-0.5 block text-xs text-text-muted">Hồ sơ được đồng bộ. Tiến độ học sẽ được đồng bộ trong bản cập nhật tới.</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
        </Card>
      </Link>
    );
  }

  return (
    <Card className="flex flex-col gap-4 bg-surface-muted" padding="sm">
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />
        <p className="text-sm text-text-subtle">
          Bạn đang dùng <strong>chế độ khách</strong>. Tiến độ chỉ được lưu trên trình duyệt của thiết bị này.
          {status === 'signed_out' && ' Tạo tài khoản miễn phí để lưu hồ sơ và tiếp tục học trên thiết bị khác.'}
        </p>
      </div>
      {status === 'signed_out' && (
        <div className="flex gap-2.5">
          <ButtonLink to="/register" size="sm" fullWidth>
            Tạo tài khoản
          </ButtonLink>
          <ButtonLink to="/login" size="sm" variant="outline" fullWidth>
            Đăng nhập
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}
