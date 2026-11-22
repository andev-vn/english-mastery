import type { ProgressSnapshot } from '@/types/progress';

export type AchievementIcon = 'footprints' | 'flame' | 'book-open' | 'target' | 'brain' | 'trophy';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  /** Returns current progress value; the achievement unlocks when value >= goal. */
  measure: (p: ProgressSnapshot) => number;
  goal: number;
}

export const achievements: AchievementDefinition[] = [
  { id: 'first-lesson', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên', icon: 'footprints', goal: 1, measure: (p) => p.completedLessons },
  { id: 'streak-3', title: 'Giữ lửa', description: 'Học 3 ngày liên tiếp', icon: 'flame', goal: 3, measure: (p) => p.bestStreak },
  { id: 'streak-7', title: 'Một tuần bền bỉ', description: 'Học 7 ngày liên tiếp', icon: 'flame', goal: 7, measure: (p) => p.bestStreak },
  { id: 'lessons-5', title: 'Chăm chỉ', description: 'Hoàn thành 5 bài học', icon: 'book-open', goal: 5, measure: (p) => p.completedLessons },
  { id: 'perfect-score', title: 'Hoàn hảo', description: 'Đạt 100% một bài luyện tập', icon: 'target', goal: 1, measure: (p) => p.perfectExercises },
  { id: 'words-20', title: 'Kho từ vựng', description: 'Ghi nhớ 20 từ (ôn đúng ít nhất 2 lần liên tiếp)', icon: 'brain', goal: 20, measure: (p) => p.wordsLearned },
  { id: 'xp-500', title: '500 XP', description: 'Tích luỹ 500 điểm kinh nghiệm', icon: 'trophy', goal: 500, measure: (p) => p.totalXp },
];
