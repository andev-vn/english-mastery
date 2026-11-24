import { BookOpenText, Headphones, Mic, PenLine } from 'lucide-react';
import type { ActivityCategory, Skill } from '@/types/content';

export const skillMeta: Record<Skill, { label: string; description: string; icon: typeof Headphones; tone: string }> = {
  listening: { label: 'Nghe', description: 'Hội thoại, nghe hiểu và nghe chép', icon: Headphones, tone: 'bg-success-soft text-success' },
  speaking: { label: 'Nói', description: 'Luyện hội thoại theo tình huống', icon: Mic, tone: 'bg-primary-soft text-primary' },
  reading: { label: 'Đọc', description: 'Bài đọc có từ vựng và câu hỏi', icon: BookOpenText, tone: 'bg-warning-soft text-warning' },
  writing: { label: 'Viết', description: 'Đề bài viết và nhận xét tự động', icon: PenLine, tone: 'bg-secondary-soft text-secondary' },
};

export const categoryLabel: Record<ActivityCategory, string> = {
  daily: 'Hằng ngày',
  work: 'Công việc',
  developer: 'Developer',
  interview: 'Phỏng vấn',
};

export const isSkill = (value: string | undefined): value is Skill =>
  value === 'listening' || value === 'speaking' || value === 'reading' || value === 'writing';
