import { BookOpen, Dumbbell, Home, Languages, UserRound } from 'lucide-react';

export const mainNavigation = [
  { to: '/dashboard', label: 'Trang chủ', icon: Home, match: ['/dashboard'] },
  { to: '/learning-path', label: 'Học', icon: BookOpen, match: ['/learning-path', '/levels', '/modules', '/lessons'] },
  { to: '/practice', label: 'Luyện tập', icon: Dumbbell, match: ['/practice'] },
  { to: '/vocabulary', label: 'Từ vựng', icon: Languages, match: ['/vocabulary'] },
  { to: '/profile', label: 'Cá nhân', icon: UserRound, match: ['/profile', '/progress', '/settings'] },
] as const;

export const isNavActive = (pathname: string, match: readonly string[]) =>
  match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
