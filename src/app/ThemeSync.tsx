import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

const THEME_COLORS = { light: '#5969E8', dark: '#10121C' };

/** Applies the theme preference to <html data-theme> and follows the OS setting in "system" mode. */
export function ThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
    };
    apply();
    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}
