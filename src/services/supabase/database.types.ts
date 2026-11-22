/**
 * Database types for the tables the client uses directly.
 * Hand-written to match supabase/migrations, in the same shape `supabase gen types` produces
 * (type aliases, not interfaces — the SDK's generics need index-compatible object types).
 * Once the project is linked, regenerate with:
 *   npx supabase gen types typescript --linked > src/services/supabase/database.types.ts
 */
import type { CefrLevel } from '@/types/content';
import type { LearningGoal } from '@/types/progress';

export type ProfileRow = {
  id: string;
  display_name: string;
  cefr_level: CefrLevel;
  goal: LearningGoal;
  explanation_language: 'vi' | 'en';
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningGoalRow = {
  user_id: string;
  daily_minutes: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      learning_goals: {
        Row: LearningGoalRow;
        Insert: Partial<LearningGoalRow> & { user_id: string };
        Update: Partial<Omit<LearningGoalRow, 'user_id'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
