import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BottomNavigation } from './BottomNavigation';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNavigation />
    </MemoryRouter>,
  );

describe('BottomNavigation', () => {
  it('renders the five main destinations', () => {
    renderAt('/dashboard');
    expect(screen.getAllByRole('link')).toHaveLength(5);
    for (const name of ['Trang chủ', 'Học', 'Luyện tập', 'Từ vựng', 'Cá nhân']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('highlights the active section for nested routes', () => {
    renderAt('/modules/a1-hello');
    expect(screen.getByRole('link', { name: 'Học' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Trang chủ' })).not.toHaveAttribute('aria-current');
  });

  it('marks settings as part of Profile', () => {
    renderAt('/settings');
    expect(screen.getByRole('link', { name: 'Cá nhân' })).toHaveAttribute('aria-current', 'page');
  });
});
