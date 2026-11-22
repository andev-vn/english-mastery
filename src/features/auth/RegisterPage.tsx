import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { authErrorMessage } from '@/services/auth/authErrors';
import { signUp } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { AuthShell, FormError, PasswordInput } from './AuthShell';
import { registerSchema, type RegisterValues } from './schemas';
import { useAuthRedirect } from './useAuthRedirect';

export default function RegisterPage() {
  const status = useAuthStore((s) => s.status);
  const localName = useProgressStore((s) => s.profile.displayName);
  const { next, finish } = useAuthRedirect();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: localName, email: '', password: '', confirmPassword: '' },
  });

  if (status === 'signed_in' && !submitted) return <Navigate to={next} replace />;

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    setSubmitted(true);
    try {
      const result = await signUp(values);
      if (result.needsEmailConfirmation) {
        setSentTo(values.email);
        return;
      }
      toast.success('Đã tạo tài khoản');
      await finish(result.userId);
    } catch (error) {
      setSubmitted(false);
      setFormError(authErrorMessage(error));
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Kiểm tra email của bạn">
        <EmptyState
          icon={<MailCheck className="size-7" />}
          title="Xác nhận địa chỉ email"
          description={`Nếu ${sentTo} chưa được đăng ký, chúng tôi đã gửi một liên kết xác nhận tới địa chỉ này. Hãy mở liên kết trên trình duyệt này để hoàn tất. Nhớ kiểm tra cả mục Spam.`}
          action={<ButtonLink to="/login">Đến trang đăng nhập</ButtonLink>}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Miễn phí. Hồ sơ học tập của bạn trên thiết bị này sẽ được liên kết với tài khoản."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to={`/login${next !== '/' ? `?redirect=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-primary">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <Input label="Tên hiển thị" autoComplete="nickname" leftIcon={<UserRound className="size-5" />} error={formState.errors.displayName?.message} {...register('displayName')} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          leftIcon={<Mail className="size-5" />}
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Mật khẩu"
          autoComplete="new-password"
          hint="Ít nhất 8 ký tự, gồm chữ và số."
          error={formState.errors.password?.message}
          {...register('password')}
        />
        <PasswordInput label="Nhập lại mật khẩu" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting} className="mt-2">
          Tạo tài khoản
        </Button>
      </form>
    </AuthShell>
  );
}
