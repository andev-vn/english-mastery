import { z } from 'zod';

const email = z.string().trim().toLowerCase().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ'));

export const newPassword = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất một chữ cái')
  .regex(/\d/, 'Mật khẩu cần có ít nhất một chữ số');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị').max(40, 'Tối đa 40 ký tự'),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });

export const forgotPasswordSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
