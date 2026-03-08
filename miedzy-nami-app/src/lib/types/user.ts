// ═══════════════════════════════════════════════════════════
//  USER & PROFILE TYPES
// ═══════════════════════════════════════════════════════════

import type { PsychologicalProfile, CommunicationStyle } from './scenario';

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  language_preference: 'pl' | 'en' | 'is';
  created_at: string;
  last_active_at: string;
  subscription_tier: 'free' | 'premium';
  onboarding_completed: boolean;
}

export interface PlayerProfile {
  user_id: string;
  traits: PsychologicalProfile;
  profile_version: number;
  quiz_completed_at: string | null;
  last_updated_at: string;
}

export interface UserStats {
  user_id: string;
  total_sessions: number;
  completed_sessions: number;
  average_score: number;
  style_distribution: Partial<Record<CommunicationStyle, number>>;
  best_scenario_scores: Record<string, number>;
  current_streak_days: number;
  longest_streak_days: number;
  scenarios_completed: string[];
  favorite_relationship_type: string | null;
}

export interface UserSettings {
  user_id: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  show_metrics_bar: boolean;
  language: 'pl' | 'en' | 'is';
  theme: 'dark' | 'light';
}

export interface DailyChallenge {
  date: string;        // YYYY-MM-DD
  scenario_id: string;
  bonus_description?: string;
}

// Default values
export const DEFAULT_PROFILE: PsychologicalProfile = {
  impulsiveness: 5,
  patience: 5,
  defensiveness: 5,
  empathy: 5,
  need_for_control: 5,
  shame_sensitivity: 5,
  directness: 5,
  repair_ability: 5,
};

export const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  sound_enabled: true,
  vibration_enabled: true,
  show_metrics_bar: true,
  language: 'pl',
  theme: 'dark',
};
