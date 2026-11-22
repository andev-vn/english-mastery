import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemePreference;
  dailyGoalMinutes: number;
  showTranslations: boolean;
  setTheme: (theme: ThemePreference) => void;
  setDailyGoal: (minutes: number) => void;
  setShowTranslations: (value: boolean) => void;
}

/** Key is also read by the inline script in index.html to avoid a theme flash. */
export const SETTINGS_STORAGE_KEY = 'em-settings';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      dailyGoalMinutes: 15,
      showTranslations: true,
      setTheme: (theme) => set({ theme }),
      setDailyGoal: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
      setShowTranslations: (showTranslations) => set({ showTranslations }),
    }),
    { name: SETTINGS_STORAGE_KEY, version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
