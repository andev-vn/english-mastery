import { LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { AuthShell } from './AuthShell';
import { NewPasswordForm } from './NewPasswordForm';

/** Reached from the password-reset email (via /auth/callback, which establishes a recovery session). */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const setRecovering = useAuthStore((s) => s.setRecovering);

  if (status === 'loading') return <PageSkeleton />;

  if (status !== 'signed_in') {
    return (
      <AuthShell title="Đặt lại mật khẩu">
        <EmptyState
          icon={<LinkIcon className="size-7" />}
          title="Liên kết không hợp lệ hoặc đã hết hạn"
          description="Hãy yêu cầu một liên kết mới và mở nó trên cùng trình duyệt."
          action={<ButtonLink to="/forgot-password">Gửi lại liên kết</ButtonLink>}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đặt mật khẩu mới" subtitle="Chọn mật khẩu mới cho tài khoản của bạn.">
      <NewPasswordForm
        submitLabel="Lưu mật khẩu mới"
        onDone={() => {
          setRecovering(false);
          toast.success('Đã đổi mật khẩu');
          navigate('/', { replace: true });
        }}
      />
    </AuthShell>
  );
}
