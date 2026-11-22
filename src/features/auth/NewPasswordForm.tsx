import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { authErrorMessage } from '@/services/auth/authErrors';
import { updatePassword } from '@/services/auth/authService';
import { FormError, PasswordInput } from './AuthShell';
import { newPasswordSchema, type NewPasswordValues } from './schemas';

/** Sets a new password for the signed-in user (password reset and account settings). */
export function NewPasswordForm({ submitLabel, onDone }: { submitLabel: string; onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: NewPasswordValues) => {
    setFormError(null);
    try {
      await updatePassword(password);
      reset();
      onDone();
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormError message={formError} />
      <PasswordInput
        label="Mật khẩu mới"
        autoComplete="new-password"
        hint="Ít nhất 8 ký tự, gồm chữ và số."
        error={formState.errors.password?.message}
        {...register('password')}
      />
      <PasswordInput label="Nhập lại mật khẩu mới" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
