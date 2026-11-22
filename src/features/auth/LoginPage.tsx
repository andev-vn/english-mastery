import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toast';
import { authErrorMessage } from '@/services/auth/authErrors';
import { signIn } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { AuthShell, FormError, PasswordInput } from './AuthShell';
import { loginSchema, type LoginValues } from './schemas';
import { useAuthRedirect } from './useAuthRedirect';

export default function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const { next, finish } = useAuthRedirect();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'signed_in' && !submitted) return <Navigate to={next} replace />;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    setSubmitted(true);
    try {
      const user = await signIn(values.email, values.password);
      toast.success('Đăng nhập thành công');
      await finish(user.id);
    } catch (error) {
      setSubmitted(false);
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Đồng bộ hồ sơ học tập của bạn trên mọi thiết bị."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to={`/register${next !== '/' ? `?redirect=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-primary">
            Tạo tài khoản
          </Link>
          <Link to="/" className="mt-3 block font-semibold text-text-subtle">
            Tiếp tục không đăng nhập
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          leftIcon={<Mail className="size-5" />}
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <PasswordInput label="Mật khẩu" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        <Link to="/forgot-password" className="-mt-1 self-end py-1 text-sm font-semibold text-primary">
          Quên mật khẩu?
        </Link>
        <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting}>
          Đăng nhập
        </Button>
      </form>
    </AuthShell>
  );
}
