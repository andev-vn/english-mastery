import { useEffect, useState } from 'react';
import { LinkIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, PageSkeleton } from '@/components/ui/States';
import { syncProfileOnSignIn } from '@/services/accountSync';
import { authErrorMessage } from '@/services/auth/authErrors';
import { resolveSessionUser, safeNextPath } from '@/services/auth/authService';
import { AuthShell } from './AuthShell';

/**
 * Landing page for email links (sign-up confirmation, password reset).
 * The Supabase client exchanges the one-time ?code on startup; we wait for that, link the
 * profile, then continue to the requested page.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(() => {
    const description = params.get('error_description');
    return description ? 'Liên kết không hợp lệ hoặc đã hết hạn.' : null;
  });

  useEffect(() => {
    if (error) return;
    let cancelled = false;
    const next = safeNextPath(params.get('next'));
    resolveSessionUser()
      .then(async (user) => {
        if (cancelled) return;
        if (!user) {
          setError('Liên kết không hợp lệ hoặc đã hết hạn. Hãy mở liên kết trên cùng trình duyệt bạn đã dùng để yêu cầu.');
          return;
        }
        await syncProfileOnSignIn(user.id).catch(() => undefined);
        if (!cancelled) navigate(next, { replace: true });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(authErrorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [error, navigate, params]);

  if (!error) return <PageSkeleton />;

  return (
    <AuthShell title="Xác thực tài khoản">
      <EmptyState
        icon={<LinkIcon className="size-7" />}
        title="Không thể xác thực"
        description={error}
        action={<ButtonLink to="/login">Đến trang đăng nhập</ButtonLink>}
      />
    </AuthShell>
  );
}
