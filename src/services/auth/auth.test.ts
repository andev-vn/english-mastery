import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackendUnavailableError } from '@/services/supabase/client';
import { authErrorMessage } from './authErrors';
import { safeNextPath } from './authService';

describe('safeNextPath', () => {
  it('allows same-origin relative paths', () => {
    expect(safeNextPath('/account')).toBe('/account');
    expect(safeNextPath('/practice/ex-a1?x=1')).toBe('/practice/ex-a1?x=1');
  });

  it('rejects absolute, protocol-relative and missing targets', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath('javascript:alert(1)')).toBe('/');
    expect(safeNextPath(null, '/dashboard')).toBe('/dashboard');
  });
});

describe('authErrorMessage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps Supabase error codes to Vietnamese', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe('Email hoặc mật khẩu không đúng.');
    expect(authErrorMessage({ code: 'weak_password' })).toMatch(/Mật khẩu quá yếu/);
  });

  it('handles rate limiting, offline and unconfigured backends', () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/quá nhanh/);
    expect(authErrorMessage(new BackendUnavailableError())).toMatch(/chưa được cấu hình/);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(authErrorMessage({ code: 'invalid_credentials' })).toMatch(/ngoại tuyến/);
  });

  it('falls back to a generic message', () => {
    expect(authErrorMessage(new Error('boom'))).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
  });
});
