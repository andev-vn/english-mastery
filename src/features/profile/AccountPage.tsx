import { useState } from 'react';
import { LogOut, Mail } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { NewPasswordForm } from '@/features/auth/NewPasswordForm';
import { authErrorMessage } from '@/services/auth/authErrors';
import { signOut } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('Đã đăng xuất');
      navigate('/profile', { replace: true });
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setSigningOut(false);
      setConfirmSignOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Tài khoản" backTo="/profile" />

      <Card className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Mail className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-text-muted">Email đăng nhập</p>
          <p className="truncate font-semibold">{user?.email ?? '—'}</p>
        </div>
      </Card>

      <section aria-labelledby="change-password">
        <SectionTitle id="change-password" title="Đổi mật khẩu" />
        <Card>
          <NewPasswordForm submitLabel="Cập nhật mật khẩu" onDone={() => toast.success('Đã đổi mật khẩu')} />
        </Card>
      </section>

      <Button variant="outline" size="lg" className="text-danger" leftIcon={<LogOut className="size-5" />} onClick={() => setConfirmSignOut(true)}>
        Đăng xuất
      </Button>

      <Modal
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Đăng xuất?"
        description="Tiến độ học trên thiết bị này vẫn được giữ lại. Bạn có thể đăng nhập lại bất cứ lúc nào."
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setConfirmSignOut(false)}>
              Huỷ
            </Button>
            <Button variant="danger" fullWidth loading={signingOut} onClick={() => void onSignOut()}>
              Đăng xuất
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">Phiên đăng nhập trên các thiết bị khác không bị ảnh hưởng.</p>
      </Modal>
    </div>
  );
}
