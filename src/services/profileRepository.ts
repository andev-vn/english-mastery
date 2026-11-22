import { requireSupabase } from '@/services/supabase/client';
import { asCefrLevel, asLearningGoal } from '@/services/supabase/guards';
import type { CefrLevel } from '@/types/content';
import type { LearningGoal } from '@/types/progress';

export interface RemoteProfile {
  displayName: string;
  level: CefrLevel;
  goal: LearningGoal;
  onboarded: boolean;
  dailyGoalMinutes: number;
  updatedAt: string;
}

export interface ProfileUpdate {
  displayName: string;
  level: CefrLevel;
  goal: LearningGoal;
  onboarded: boolean;
  dailyGoalMinutes: number;
}

/** Reads the signed-in user's profile. RLS guarantees only the caller's own row is visible. */
export async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  const supabase = await requireSupabase();
  const [profile, goal] = await Promise.all([
    supabase.from('profiles').select('display_name, cefr_level, goal, onboarded, updated_at').eq('id', userId).maybeSingle(),
    supabase.from('learning_goals').select('daily_minutes').eq('user_id', userId).maybeSingle(),
  ]);
  if (profile.error) throw profile.error;
  if (goal.error) throw goal.error;
  if (!profile.data) return null;
  return {
    displayName: profile.data.display_name,
    level: asCefrLevel(profile.data.cefr_level),
    goal: asLearningGoal(profile.data.goal),
    onboarded: profile.data.onboarded,
    dailyGoalMinutes: goal.data?.daily_minutes ?? 15,
    updatedAt: profile.data.updated_at,
  };
}

/** Writes the profile and daily goal; returns the server's new updated_at. */
export async function saveProfile(userId: string, update: ProfileUpdate): Promise<string> {
  const supabase = await requireSupabase();
  const [profile, goal] = await Promise.all([
    supabase
      .from('profiles')
      .update({ display_name: update.displayName.slice(0, 40), cefr_level: update.level, goal: update.goal, onboarded: update.onboarded })
      .eq('id', userId)
      .select('updated_at')
      .single(),
    supabase.from('learning_goals').update({ daily_minutes: update.dailyGoalMinutes }).eq('user_id', userId),
  ]);
  if (profile.error) throw profile.error;
  if (goal.error) throw goal.error;
  return profile.data.updated_at;
}
