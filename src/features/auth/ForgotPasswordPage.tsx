import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import { authErrorMessage } from '@/services/auth/authErrors';
import { requestPasswordReset } from '@/services/auth/authService';
import { AuthShell, FormError } from './AuthShell';
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas';

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Kiểm tra email của bạn">
        <EmptyState
          icon={<MailCheck className="size-7" />}
          title="Đã gửi hướng dẫn"
          // Same message whether or not the address exists, to avoid revealing registered emails.
          description={`Nếu ${sentTo} có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy mở liên kết trên trình duyệt này.`}
          action={<ButtonLink to="/login">Quay lại đăng nhập</ButtonLink>}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={
        <Link to="/login" className="font-semibold text-primary">
          Quay lại đăng nhập
        </Link>
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
        <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting}>
          Gửi liên kết
        </Button>
      </form>
    </AuthShell>
  );
}
