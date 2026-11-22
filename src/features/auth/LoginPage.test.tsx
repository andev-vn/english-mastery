import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '@/app/guards';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from './LoginPage';
import { signIn } from '@/services/auth/authService';
import type * as AuthService from '@/services/auth/authService';

vi.mock('@/lib/env', () => ({ isSupabaseConfigured: true, env: { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'sb_publishable_x', supabaseIssue: null } }));
vi.mock('@/services/accountSync', () => ({ syncProfileOnSignIn: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/services/auth/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof AuthService>()),
  signIn: vi.fn(),
}));

function renderApp(initial: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { element: <RequireAuth />, children: [{ path: '/account', element: <p>Account page</p> }] },
      { path: '/', element: <p>Home</p> },
    ],
    { initialEntries: [initial] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('authentication flow', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
    useAuthStore.getState().setSignedOut();
  });

  it('protected routes redirect to login with a return path', async () => {
    const router = renderApp('/account');
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?redirect=%2Faccount');
  });

  it('validates the form before calling the backend', async () => {
    renderApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText('Vui lòng nhập email')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a friendly error for wrong credentials', async () => {
    vi.mocked(signIn).mockRejectedValue({ code: 'invalid_credentials', status: 400 });
    renderApp('/login');
    await userEvent.type(await screen.findByLabelText('Email'), 'lan@example.test');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'wrongpass1');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
  });

  it('signs in and returns to the requested page', async () => {
    vi.mocked(signIn).mockImplementation(async () => {
      useAuthStore.getState().setSignedIn({ id: 'u1', email: 'lan@example.test' });
      return { id: 'u1' } as Awaited<ReturnType<typeof signIn>>;
    });
    const router = renderApp('/login?redirect=%2Faccount');
    await userEvent.type(await screen.findByLabelText('Email'), ' Lan@Example.test ');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText('Account page')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/account');
    expect(signIn).toHaveBeenCalledWith('lan@example.test', 'secret123');
  });

  it('ignores external redirect targets', async () => {
    useAuthStore.getState().setSignedIn({ id: 'u1', email: null });
    const router = renderApp('/login?redirect=https%3A%2F%2Fevil.example');
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});
