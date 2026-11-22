import { useState, type ComponentProps, type ReactNode } from 'react';
import { CloudOff, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from '@/components/ui/Logo';
import { EmptyState } from '@/components/ui/States';
import { isSupabaseConfigured } from '@/lib/env';
import { Link } from 'react-router';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for authentication screens. Shows a friendly notice when accounts are not configured. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex flex-1 flex-col animate-fade-up">
      <Link to="/" className="pt-4 pb-8" aria-label="English Mastery — trang chủ">
        <Logo />
      </Link>
      {isSupabaseConfigured ? (
        <>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <div className="mt-1.5 text-[15px] text-text-subtle">{subtitle}</div>}
          <div className="mt-7 flex-1">{children}</div>
          {footer && <div className="pt-6 pb-2 text-center text-sm text-text-subtle">{footer}</div>}
        </>
      ) : (
        <EmptyState
          className="my-auto"
          icon={<CloudOff className="size-7" />}
          title="Tài khoản chưa khả dụng"
          description="Máy chủ tài khoản chưa được cấu hình. Bạn vẫn có thể học đầy đủ ở chế độ khách — tiến độ được lưu trên thiết bị này."
          action={<ButtonLink to="/">Tiếp tục học</ButtonLink>}
        />
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'rightSlot'>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <IconButton
          label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          icon={visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
